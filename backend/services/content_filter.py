# backend/services/content_filter.py
from services.openai_client import OpenAIService
from config import INAPPROPRIATE_WORDS

class ContentFilter:
    
    @staticmethod
    def check_text_content(text: str) -> dict:
        """Check if text contains inappropriate content"""
        # Simple keyword filter
        text_lower = text.lower()
        for word in INAPPROPRIATE_WORDS:
            if word.lower() in text_lower:
                return {
                    "inappropriate": True,
                    "reason": "Contains inappropriate language"
                }
        
        return {"inappropriate": False}
    
    @staticmethod
    def check_audio_content(audio_bytes: bytes) -> dict:
        """Check if audio contains inappropriate content"""
        try:
            # First transcribe the audio
            transcription = OpenAIService.transcribe_audio(audio_bytes)
            
            # Then check the transcription
            return ContentFilter.check_text_content(transcription)
            
        except Exception as e:
            print(f"Error checking audio content: {e}")
            # In case of error, allow the content
            return {"inappropriate": False}
    
    @staticmethod
    def filter_simulation_response(response: str, simulation_type: str) -> str:
        """Filter and adjust AI responses based on simulation type"""
        if simulation_type == "road_rage_sim":
            # For road rage, we want to teach de-escalation
            # Replace any overly aggressive language with firm but polite alternatives
            replacements = {
                # Add specific replacements based on your needs
            }
            
            for old, new in replacements.items():
                response = response.replace(old, new)
        
        return response