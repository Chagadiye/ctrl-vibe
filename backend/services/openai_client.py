# backend/services/openai_client.py
import openai
from openai import OpenAI
import tempfile
import base64
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

class OpenAIService:
    @staticmethod
    def transcribe_audio(audio_data: bytes, language: str = "kn") -> str:
        """
        Transcribe audio using OpenAI's latest transcription model
        Args:
            audio_data: Audio file bytes
            language: Language code (default: 'kn' for Kannada)
        Returns:
            Transcribed text
        """
        try:
            # Save audio data to a temporary file
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name
                     
            # Open the file and send to the new transcription model
            with open(temp_file_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="gpt-4o-mini-transcribe",  # Updated model
                    file=audio_file,
                    language=language,
                    response_format="text"
                )
                     
            return transcript
                     
        except Exception as e:
            print(f"Error in transcription: {e}")
            # Fallback to original Whisper if new model fails
            try:
                with open(temp_file_path, "rb") as audio_file:
                    transcript = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language=language,
                        response_format="text"
                    )
                return transcript
            except Exception as fallback_e:
                print(f"Fallback transcription also failed: {fallback_e}")
                return ""

    @staticmethod
    def text_to_speech(text: str, voice: str = "alloy") -> str:
        """
        Convert text to speech using OpenAI's latest TTS model
        Args:
            text: Text to convert
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
        Returns:
            Base64 encoded audio data
        """
        try:
            response = client.audio.speech.create(
                model="gpt-4o-mini-tts",  # Updated model
                voice=voice,
                input=text,
                response_format="mp3"
            )
                     
            # Convert to base64 for easy transmission
            audio_content = response.content
            audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                     
            return f"data:audio/mp3;base64,{audio_base64}"
                     
        except Exception as e:
            print(f"Error in TTS with new model: {e}")
            # Fallback to original TTS model
            try:
                response = client.audio.speech.create(
                    model="tts-1",
                    voice=voice,
                    input=text,
                    response_format="mp3"
                )
                audio_content = response.content
                audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                return f"data:audio/mp3;base64,{audio_base64}"
            except Exception as fallback_e:
                print(f"Fallback TTS also failed: {fallback_e}")
                return ""

    @staticmethod
    def evaluate_pronunciation(original_text: str, user_audio: bytes) -> dict:
        """
        Evaluate user's pronunciation by comparing with original text
        """
        try:
            # Transcribe user's audio using the new model
            user_text = OpenAIService.transcribe_audio(user_audio, language="kn")
                     
            # Use the latest GPT model for evaluation
            prompt = f"""
            Compare these two Kannada texts and rate the pronunciation accuracy:
            Original: {original_text}
            User said: {user_text}
                     
            Provide a JSON response with:
            1. accuracy_score (0-100)
            2. feedback (helpful feedback in English)
            3. correct (boolean - if pronunciation is acceptable)
            """
                     
            response = client.chat.completions.create(
                model="gpt-4o",  # Updated to current stable model
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
                     
            import json
            return json.loads(response.choices[0].message.content)
                     
        except Exception as e:
            print(f"Error in pronunciation evaluation: {e}")
            return {
                "accuracy_score": 0,
                "feedback": "Could not evaluate pronunciation",
                "correct": False
            }