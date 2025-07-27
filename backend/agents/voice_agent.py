# backend/agents/voice_agent.py
import asyncio
import logging
import json
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, ChatContext, JobContext
from livekit.plugins import (
    openai,
    silero,
)
from config import OPENAI_API_KEY, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL

load_dotenv()
logger = logging.getLogger(__name__)

class KannadaSimulationAgent(Agent):
    def __init__(self, simulation_config: dict) -> None:
        self._tasks = []
        self.config = simulation_config
        self._session = None
        # Use the system prompt from config
        super().__init__(instructions=simulation_config["system_prompt"])
    
    def set_session(self, session):
        """Set the session reference so we can use session.say()"""
        self._session = session
    
    async def on_enter(self):
        """Called when the agent enters the room"""
        logger.info(f"Agent entered room for simulation: {self.config.get('name', 'unknown')}")
        
        # Wait a moment for connection to stabilize
        await asyncio.sleep(2.0)
        
        # Send initial greeting
        if self._session:
            logger.info(f"Sending initial message: {self.config['initial_message']}")
            await self._session.say(self.config["initial_message"])
        else:
            logger.warning("No session reference available")

    async def on_user_speech_committed(self, user_msg):
        """Called when user speech is committed (STT complete)"""
        logger.info(f"User said: {user_msg.content}")
        
        # Generate response using the LLM
        chat_ctx = ChatContext()
        chat_ctx.messages.append(user_msg)
        
        # Add system context about the simulation
        system_msg = f"""You are in a {self.config['name']} simulation. 
        Current context: {self.config.get('description', '')}
        
        Remember to:
        - Stay in character
        - Respond naturally and conversationally
        - Keep responses short (1-2 sentences)
        - Use the language style specified in your system prompt
        """
        
        response = await self._session.llm.generate_reply(
            messages=chat_ctx.messages,
            system_prompt=system_msg + "\n\n" + self.config["system_prompt"]
        )
        
        logger.info(f"Agent responding: {response.content}")
        await self._session.say(response.content)

def get_simulation_config(simulation_type: str) -> dict:
    """Get configuration for a specific simulation"""
    simulations = {
        "auto_driver_sim": {
            "name": "Auto Driver Simulation",
            "description": "Auto-rickshaw negotiation in Bengaluru",
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
            "name": "Salary Negotiation Simulation", 
            "description": "Tech salary discussion in Bengaluru IT company",
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
            "name": "Crush Conversation Simulation",
            "description": "Coffee shop conversation in Koramangala",
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
            "name": "Road Rage De-escalation Simulation",
            "description": "Traffic incident de-escalation practice",
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
    
    return simulations.get(simulation_type, simulations["auto_driver_sim"])

async def entrypoint(ctx: agents.JobContext):
    """Main entry point for the LiveKit agent"""
    logger.info(f"Agent started for room: {ctx.room.name}")
    
    # Parse simulation type from room metadata
    try:
        room_metadata = json.loads(ctx.room.metadata) if ctx.room.metadata else {}
        simulation_type = room_metadata.get("simulation_type", "auto_driver_sim")
        user_id = room_metadata.get("user_id", "unknown")
    except (json.JSONDecodeError, TypeError):
        simulation_type = "auto_driver_sim"
        user_id = "unknown"
    
    logger.info(f"Starting {simulation_type} for user {user_id}")
    
    # Get simulation configuration
    config = get_simulation_config(simulation_type)
    
    # Create the simulation agent
    agent = KannadaSimulationAgent(config)
    
    # Create agent session with the pipeline components
    session = AgentSession(
        stt=openai.STT(
            model="gpt-4o-transcribe",
            language="en",  # Whisper can handle multilingual including Kannada
        ),
        llm=openai.LLM(
            model="gpt-4.1-2025-04-14",
            temperature=0.8
        ),
        tts=openai.TTS(
            voice=config["voice"],
            model="gpt-4o-mini-tts",
            speed=1.0,
        ),
        vad=silero.VAD.load(),
    )
    
    # Connect to room
    await ctx.connect()
    
    # Set the session reference in the agent so it can use session.say()
    agent.set_session(session)
    
    # Start the session
    try:
        await session.start(
            room=ctx.room,
            agent=agent,
            room_input_options=RoomInputOptions(
                # Add any additional options here
            ),
        )
        
        logger.info(f"Session started successfully for {config['name']}")
        
        # Keep the session running
        await asyncio.sleep(3600)  # 1 hour max conversation
        
    except Exception as e:
        logger.error(f"Session failed: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
    finally:
        logger.info("Session ended")

def run_agent():
    """Run the LiveKit agent"""
    try:
        agents.cli.run_app(
            agents.WorkerOptions(
                entrypoint_fnc=entrypoint,
                api_key=LIVEKIT_API_KEY,
                api_secret=LIVEKIT_API_SECRET,
                ws_url=LIVEKIT_URL,
            )
        )
    except Exception as e:
        logger.error(f"Failed to run agent: {e}")
        raise

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    run_agent()