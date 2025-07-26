from services import gemini_client, tts_client, stt_client

def start_simulation(simulation_type: str):
    """
    Starts a simulation and gets the initial message from the AI.
    """
    # The history starts empty. The system prompt will guide the first response.
    history = []
    initial_bot_message = gemini_client.generate_simulation_response(simulation_type, history)
    
    # Append the bot's first message to the history for the next turn
    history.append({"role": "model", "parts": [initial_bot_message]})
    
    audio_url = tts_client.synthesize_speech(initial_bot_message)
    
    return {
        "text": initial_bot_message,
        "audio_url": audio_url,
        "history": history
    }

def process_user_turn(simulation_type: str, history: list, user_audio: bytes):
    """
    Processes one turn of the conversation.
    1. Transcribe user audio to text.
    2. Add user text to history.
    3. Get AI response from Gemini.
    4. Synthesize AI response to audio.
    5. Return the new state.
    """
    # 1. Transcribe user audio
    user_text = stt_client.transcribe_audio(user_audio)
    if not user_text:
        return {"error": "Could not understand audio."}

    # 2. Add user's message to history
    history.append({"role": "user", "parts": [user_text]})

    # 3. Get AI response
    bot_text = gemini_client.generate_simulation_response(simulation_type, history)

    # 4. Add AI's response to history for the next turn
    history.append({"role": "model", "parts": [bot_text]})

    # 5. Synthesize AI response to audio
    audio_url = tts_client.synthesize_speech(bot_text)

    return {
        "text": bot_text,
        "audio_url": audio_url,
        "history": history
    }
