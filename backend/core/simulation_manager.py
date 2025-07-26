# backend/core/simulation_manager.py
from services.openai_client import OpenAIService
from services.content_filter import ContentFilter
from core.database import mongo, SIMULATION_HISTORY_COLLECTION
from models.user import SimulationHistory
from datetime import datetime
from openai import OpenAI
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

def get_simulation_prompt(simulation_type):
    """Get the system prompt for different simulation types"""
    prompts = {
        "auto_driver_sim": """You are a friendly but firm auto-rickshaw driver in Bengaluru named Manjunath.
- Start by asking where they want to go in Kannada
- Respond ONLY in simple, spoken Kannada with English transliteration in brackets
- Example format: ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು? [Ellige hogabeku?]
- Quote a fair but slightly high initial fare (150-200% of actual)
- Be willing to negotiate down to a fair price
- Use common auto driver phrases and expressions
- Keep responses short and conversational (1-2 sentences)
- End when destination and price are agreed""",
        
        "salary_negotiation_sim": """You are a professional but understanding manager at a Bengaluru tech company.
- Respond in Kanglish (mix of Kannada and English) as is common in offices
- Ask about their achievements and contributions
- Be reasonable but don't agree immediately
- Mention company policies and budget constraints
- Appreciate their work while being realistic
- Keep the tone professional yet friendly""",
        
        "crush_conversation_sim": """You are a friendly person named Priya (if talking to male) or Prakash (if talking to female).
- You're meeting at a coffee shop in Koramangala
- Respond in simple, encouraging Kannada with transliteration
- Ask about their hobbies, work, and life in Bengaluru
- Show genuine interest in getting to know them
- Use casual, friendly language
- Occasionally compliment their Kannada attempts
- Keep the conversation light and positive""",
        
        "road_rage_sim": """You are another driver who just had a minor traffic incident.
- Start slightly agitated but not overly aggressive
- Use firm Kannada expressions but avoid extreme profanity
- Gradually calm down if the user apologizes properly
- Teach de-escalation through the interaction
- If user is aggressive, become defensive but still reasonable
- End peacefully if user handles it well
- Include common traffic-related Kannada phrases"""
    }
    
    return prompts.get(simulation_type, "You are a helpful Kannada tutor.")

def start_simulation(simulation_type: str, user_id: str = None):
    """
    Starts a simulation and gets the initial message from the AI.
    """
    system_prompt = get_simulation_prompt(simulation_type)
    
    # Create initial message based on simulation type
    initial_messages = {
        "auto_driver_sim": "ನಮಸ್ಕಾರ ಸಾರ್/ಮೇಡಮ್, ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು? [Namaskara sir/madam, ellige hogabeku?]",
        "salary_negotiation_sim": "Hi, ನೀವು salary discussion ಗೆ ಬಂದಿದ್ದೀರಾ? Please, ಕೂತುಕೊಳ್ಳಿ. [Neevu salary discussion ge bandiddira? Please, kuthukolli.]",
        "crush_conversation_sim": "ಹಾಯ್! ನೀವು ಬಂದಿದ್ದೀರಾ? ತುಂಬಾ ಚೆನ್ನಾಗಿ ಕಾಣುತ್ತಿದ್ದೀರಿ! [Hi! Neevu bandiddira? Thumba chennagi kaanuttiddiri!]",
        "road_rage_sim": "ಏಯ್! ಏನು ಮಾಡ್ತಿದ್ದೀಯಾ? ನೋಡಿ ಗಾಡಿ ಓಡಿಸಬೇಕು! [Ey! Enu madtiddiya? Nodi gaadi odisabeku!]"
    }
    
    initial_bot_message = initial_messages.get(simulation_type, "ನಮಸ್ಕಾರ! [Namaskara!]")
    
    # Generate audio for the initial message
    audio_url = OpenAIService.text_to_speech(initial_bot_message)
    
    # Create simulation history entry if user_id provided
    if user_id:
        sim_history = SimulationHistory(user_id, simulation_type)
        sim_history.conversation.append({
            "role": "assistant",
            "message": initial_bot_message,
            "timestamp": datetime.utcnow()
        })
        mongo.db[SIMULATION_HISTORY_COLLECTION].insert_one(sim_history.to_dict())
    
    return {
        "text": initial_bot_message,
        "audio_url": audio_url,
        "history": [{"role": "system", "content": system_prompt}, 
                   {"role": "assistant", "content": initial_bot_message}]
    }

def process_user_turn(simulation_type: str, history: list, user_audio: bytes, user_id: str = None):
    """
    Processes one turn of the conversation.
    """
    # 1. Transcribe user audio
    user_text = OpenAIService.transcribe_audio(user_audio, language="kn")
    if not user_text:
        return {"error": "Could not understand audio. Please try again."}

    # 2. Add user's message to history
    history.append({"role": "user", "content": user_text})

    # 3. Get AI response using GPT-4
    try:
        # Ensure system prompt is at the beginning
        if not history or history[0].get("role") != "system":
            system_prompt = get_simulation_prompt(simulation_type)
            history.insert(0, {"role": "system", "content": system_prompt})
        
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=history,
            temperature=0.7,
            max_tokens=150
        )
        
        bot_text = response.choices[0].message.content
        
        # Apply content filtering for certain simulations
        if simulation_type == "road_rage_sim":
            bot_text = ContentFilter.filter_simulation_response(bot_text, simulation_type)
        
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        bot_text = "ಕ್ಷಮಿಸಿ, ಸ್ವಲ್ಪ ಸಮಸ್ಯೆ ಆಗಿದೆ. [Kshamisi, swalpa samasye agide.]"

    # 4. Add AI's response to history
    history.append({"role": "assistant", "content": bot_text})

    # 5. Synthesize AI response to audio
    audio_url = OpenAIService.text_to_speech(bot_text)
    
    # 6. Update simulation history if user_id provided
    if user_id:
        # Update the conversation in database
        mongo.db[SIMULATION_HISTORY_COLLECTION].update_one(
            {"user_id": user_id, "simulation_type": simulation_type},
            {
                "$push": {
                    "conversation": {
                        "$each": [
                            {"role": "user", "message": user_text, "timestamp": datetime.utcnow()},
                            {"role": "assistant", "message": bot_text, "timestamp": datetime.utcnow()}
                        ]
                    }
                },
                "$inc": {"duration": 30}  # Assume 30 seconds per turn
            }
        )
    
    # 7. Check if conversation should end
    end_conversation = check_conversation_end(simulation_type, history)
    
    response_data = {
        "text": bot_text,
        "audio_url": audio_url,
        "history": history,
        "end_conversation": end_conversation
    }
    
    if end_conversation:
        # Calculate score and provide feedback
        score, feedback = evaluate_simulation(simulation_type, history)
        response_data["score"] = score
        response_data["feedback"] = feedback
        
        # Update simulation history with final score
        if user_id:
            mongo.db[SIMULATION_HISTORY_COLLECTION].update_one(
                {"user_id": user_id, "simulation_type": simulation_type},
                {"$set": {"score": score, "feedback": feedback}}
            )
    
    return response_data

def check_conversation_end(simulation_type: str, history: list) -> bool:
    """Check if the conversation should end based on simulation goals"""
    if len(history) > 20:  # Max 10 exchanges
        return True
    
    last_message = history[-1]["content"].lower() if history else ""
    
    if simulation_type == "auto_driver_sim":
        # End if price is agreed
        end_phrases = ["ಸರಿ", "okay", "ಆಯ್ತು", "alright", "ಹೋಗೋಣ"]
        return any(phrase in last_message for phrase in end_phrases)
    
    elif simulation_type == "salary_negotiation_sim":
        # End if negotiation concludes
        end_phrases = ["thank you", "ಧನ್ಯವಾದ", "will consider", "ಆಲೋಚಿಸುತ್ತೇನೆ"]
        return any(phrase in last_message for phrase in end_phrases)
    
    return False

def evaluate_simulation(simulation_type: str, history: list) -> tuple:
    """Evaluate the simulation performance and provide feedback"""
    score = 70  # Base score
    feedback = {}
    
    # Count user turns (excluding system messages)
    user_messages = [msg for msg in history if msg["role"] == "user"]
    
    if simulation_type == "auto_driver_sim":
        # Check if user negotiated
        if len(user_messages) > 2:
            score += 10
            feedback["negotiation"] = "Good job negotiating!"
        
        # Check politeness
        polite_words = ["ದಯವಿಟ್ಟು", "please", "ಧನ್ಯವಾದ", "thank"]
        if any(word in " ".join([m["content"] for m in user_messages]).lower() for word in polite_words):
            score += 20
            feedback["politeness"] = "Excellent use of polite language!"
    
    elif simulation_type == "road_rage_sim":
        # Check if user de-escalated
        apology_words = ["ಕ್ಷಮಿಸಿ", "sorry", "ನನ್ನ ತಪ್ಪು", "mistake"]
        if any(word in " ".join([m["content"] for m in user_messages]).lower() for word in apology_words):
            score += 30
            feedback["de_escalation"] = "Great job de-escalating the situation!"
    
    feedback["overall"] = f"You scored {score}/100. Keep practicing!"
    
    return score, feedback