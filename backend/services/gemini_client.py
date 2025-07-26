
import google.generativeai as genai
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

def get_simulation_prompt(simulation_type, history):
    """Creates a detailed system prompt for the Gemini model based on the simulation."""
    prompts = {
        "auto_driver_sim": """
            You are a friendly but firm auto-rickshaw driver in Bengaluru. Your name is Manjunath.
            - Start the conversation by asking the user where they want to go in Kannada.
            - Respond only in simple, spoken Kannada. Provide the English transliteration in brackets. Example: ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು? [Ellige hogabeku?]
            - The user will try to negotiate the fare. Stick to a fair price.
            - Keep your responses short and conversational.
            - If the user says something completely wrong, gently correct them.
            - Your goal is to have a realistic, 2-3 minute conversation.
            - End the conversation when a destination and price are agreed upon.
        """,
        "salary_negotiation_sim": """
            You are a polite but professional manager at a tech company in Bengaluru.
            - The user is your employee and wants to discuss a salary raise.
            - Respond in a mix of simple Kannada and English (Kanglish), as is common in offices.
            - Ask for their accomplishments and justifications for the raise.
            - Be reasonable but don't agree immediately.
            - Your goal is to simulate a professional negotiation.
        """,
        "crush_conversation_sim": """
            You are a friendly person named Priya/Prakash. The user has a crush on you.
            - You are meeting them at a coffee shop in Koramangala.
            - Respond in very simple, encouraging, and friendly Kannada.
            - Ask them about their hobbies, what they do, and their life in Bengaluru.
            - Keep the conversation light and positive.
            - Your goal is to make the user feel comfortable practicing conversational Kannada.
        """
    }
    system_instruction = prompts.get(simulation_type, "You are a helpful Kannada tutor.")
    
    # We build a history for the model, with the system instruction first.
    # Note: The new Gemini API prefers the instruction within the first user message.
    conversation_context = [{"role": "user", "parts": [system_instruction]}]
    conversation_context.append({"role": "model", "parts": ["Ok, I am ready. What is the user's first message?"]})

    # Add the actual conversation history
    conversation_context.extend(history)
    
    return conversation_context


def generate_simulation_response(simulation_type: str, history: list) -> str:
    """
    Generates a response from the AI bot for a simulation.
    Args:
        simulation_type: The ID of the simulation (e.g., 'auto_driver_sim').
        history: A list of conversation turns, e.g., [{'role': 'user', 'parts': ['text']}, ...].
    Returns:
        The text response from the Gemini model.
    """
    try:
        prompt = get_simulation_prompt(simulation_type, history)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "Sorry, I am having trouble responding right now."
