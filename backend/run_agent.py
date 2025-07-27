#!/usr/bin/env python
"""
Run the LiveKit voice agent for Kannada simulations
"""

import sys
import os
import logging

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("🎙️  Starting Kannada Simulation Voice Agent...")
    print("📡 Connecting to LiveKit server...")
    
    try:
        # Try the main agent first
        from agents.voice_agent import run_agent
        print("✅ Using MultimodalAgent implementation")
        run_agent()
    except (ImportError, ModuleNotFoundError) as e:
        print(f"⚠️  Main agent failed: {e}")
        print("🔄 Trying simplified agent...")
        try:
            from agents.simple_voice_agent import run_simple_agent
            print("✅ Using simplified agent implementation")
            run_simple_agent()
        except Exception as e2:
            print(f"❌ Both agents failed: {e2}")
            print("\n🛠️  Please check your LiveKit dependencies:")
            print("   uv add 'livekit>=0.15.0' 'livekit-agents>=0.15.0' 'livekit-plugins-openai>=0.15.0'")
            sys.exit(1)

if __name__ == "__main__":
    print("✅ Agent is ready to handle conversations!")
    print("\nPress Ctrl+C to stop the agent\n")
    
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Agent stopped gracefully")