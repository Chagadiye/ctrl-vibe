# backend/agents/voice_agent.py
import asyncio
import logging
from typing import Dict, Optional
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.plugins import openai, silero
from config import OPENAI_API_KEY, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL
import json

logger = logging.getLogger(__name__)

class KannadaSimulationAgent:
    def __init__(self):
        self.simulations = {
            "auto_driver_sim": {
                "system_prompt": """You are Manjunath, a friendly but firm auto-rickshaw driver in Bengaluru.
- Speak ONLY in simple Kannada mixed with occasional English words
- Start by asking "ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು sir/madam?" (Where do you want to go?)
- Quote a fare that's 150-200% of actual (e.g., Majestic to Koramangala = ₹300-400)
- Be willing to negotiate down to ₹150-200
- Use phrases like:
  - "ಅಷ್ಟು ದೂರ sir, traffic ತುಂಬಾ ಇದೆ" (It's far sir, too much traffic)
  - "Meter ಹಾಕಿದ್ರೆ ₹250 ಆಗುತ್ತೆ, fixed ₹200 ಕೊಡಿ" (By meter it'll be 250, give fixed 200)
  - "ಸರಿ ಸರಿ, last ₹180" (OK OK, final 180)
- Keep responses SHORT (1-2 sentences)
- End when price is agreed with "ಸರಿ, ಹತ್ತಿ" (OK, get in)""",
                "voice": "alloy",
                "initial_message": "ನಮಸ್ಕಾರ sir, ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?"
            },
            
            "salary_negotiation_sim": {
                "system_prompt": """You are a tech manager in a Bengaluru IT company having a salary discussion.
- Speak in Kanglish (mix of Kannada and English)
- Be professional but understanding
- Ask about achievements: "So, ನಿಮ್ಮ contributions ಏನು ಇದೆ this year?"
- Mention constraints: "Budget tight ಇದೆ, but ನಿಮ್ಮ work appreciate ಮಾಡ್ತೀವಿ"
- Offer realistic increments (10-20%)
- Use corporate Kannada phrases
- Keep responses conversational and realistic""",
                "voice": "echo",
                "initial_message": "Hi, ಬನ್ನಿ ಬನ್ನಿ. Salary discussion ಗೆ ಬಂದಿದ್ದೀರಾ? Please sit."
            },
            
            "crush_conversation_sim": {
                "system_prompt": """You are Priya/Prakash meeting someone at a coffee shop in Koramangala.
- Be friendly, warm, and encouraging
- Speak simple Kannada with English mix
- Ask about their interests: "ನಿಮಗೆ Bengaluru ಇಷ್ಟ ಆಯ್ತಾ?"
- Compliment their Kannada attempts: "ತುಂಬಾ ಚೆನ್ನಾಗಿ Kannada ಮಾತಾಡ್ತಿದ್ದೀರಿ!"
- Share about favorite places, food, movies
- Keep it light and fun
- React positively to their responses""",
                "voice": "nova",
                "initial_message": "Hi! ನೀವು ಬಂದಿದ್ದೀರಾ? Coffee order ಮಾಡೋಣಾ?"
            },
            
            "road_rage_sim": {
                "system_prompt": """You are another driver who just had a minor traffic incident.
- Start mildly agitated: "ಏಯ್! ಏನು ಮಾಡ್ತಿದ್ದೀಯಾ?"
- Use firm but not abusive language
- If they apologize, gradually calm down
- Teach de-escalation through responses
- Use traffic-related Kannada:
  - "Signal ಕೊಡದೆ turn ಯಾಕೆ?" (Why turn without signal?)
  - "ಸ್ವಲ್ಪ carefully drive ಮಾಡಿ" (Drive a bit carefully)
- End peacefully if handled well: "ಸರಿ, next time careful ಆಗಿ"
- Keep emotional but not extreme""",
                "voice": "onyx",
                "initial_message": "ಏಯ್! ಏನು ಮಾಡ್ತಿದ್ದೀಯಾ? Signal ಕೊಡದೆ brake ಹಾಕಿದ್ಯಾ?"
            }
        }
        
        # Chat context and conversation state
        self.chat_messages = []
        self.current_simulation = None
        self.conversation_active = False
    
    def get_simulation_config(self, simulation_type: str) -> Dict:
        """Get configuration for a specific simulation"""
        return self.simulations.get(simulation_type, self.simulations["auto_driver_sim"])

async def entrypoint(ctx: JobContext):
    """Main entry point for the LiveKit agent"""
    logger.info(f"Agent started for room: {ctx.room.name}")
    
    # Parse simulation type from room metadata
    room_metadata = json.loads(ctx.room.metadata) if ctx.room.metadata else {}
    simulation_type = room_metadata.get("simulation_type", "auto_driver_sim")
    user_id = room_metadata.get("user_id", "unknown")
    
    logger.info(f"Starting {simulation_type} for user {user_id}")
    
    # Initialize the Kannada simulation agent
    kannada_agent = KannadaSimulationAgent()
    config = kannada_agent.get_simulation_config(simulation_type)
    kannada_agent.current_simulation = simulation_type
    
    # Initialize plugins
    initial_ctx = agents.llm.ChatContext().append(
        role="system",
        text=config["system_prompt"]
    )
    
    # Create the agent
    agent = agents.MultimodalAgent(
        model=openai.realtime.RealtimeModel(
            api_key=OPENAI_API_KEY,
            voice=config["voice"],
            temperature=0.8,
            instructions=config["system_prompt"],
            modalities=["text", "audio"],
        ),
        chat_ctx=initial_ctx,
    )
    
    # Connect to the room
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    
    # Start the agent
    agent.start(ctx.room)
    
    # Send initial greeting after a short delay
    await asyncio.sleep(2.0)
    await agent.say(config["initial_message"])
    
    # Track conversation metrics
    conversation_start = asyncio.get_event_loop().time()
    turn_count = 0
    
    # Event handlers
    @ctx.room.on("participant_connected")
    def on_participant_connected(participant: rtc.RemoteParticipant):
        logger.info(f"Participant connected: {participant.identity}")
    
    @ctx.room.on("participant_disconnected") 
    def on_participant_disconnected(participant: rtc.RemoteParticipant):
        logger.info(f"Participant disconnected: {participant.identity}")
    
    @ctx.room.on("track_published")
    def on_track_published(publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
        logger.info(f"Track published: {publication.kind} by {participant.identity}")
        nonlocal turn_count
        turn_count += 1
    
    # Keep the agent running
    try:
        await asyncio.sleep(300)  # 5 minute max conversation
    except asyncio.CancelledError:
        logger.info("Agent cancelled")
    finally:
        # Calculate conversation metrics
        duration = asyncio.get_event_loop().time() - conversation_start
        logger.info(f"Conversation ended - Duration: {duration}s, Turns: {turn_count}")

def run_agent():
    """Run the LiveKit agent"""
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
            ws_url=LIVEKIT_URL,
        )
    )

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_agent()