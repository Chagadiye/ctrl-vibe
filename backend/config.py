import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SMALLEST_AI_API_KEY = os.getenv("SMALLEST_AI_API_KEY")