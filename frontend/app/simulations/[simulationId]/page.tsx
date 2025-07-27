// frontend/app/simulations/[simulationId]/page.tsx - No Auth Version
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Trophy, AlertCircle } from "lucide-react";
import VoiceConversation from "@/components/VoiceConversation";
import DemoVoiceConversation from "@/components/DemoVoiceConversation";
import axios from "axios";
import { useXPStore } from "@/store/xpStore";
import { API } from "@/lib/utils"

// Use direct URL instead of importing API from utils to avoid double path issue

interface SimulationSession {
  room_name: string;
  access_token: string;
  livekit_url: string;
  simulation: {
    title: string;
    description: string;
    tips: string[];
  };
}

export default function SimulationPracticePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const simulationId = params.simulationId as string;
  const ageVerified = searchParams.get('age_verified') === 'true';
  
  const { submitLesson } = useXPStore();
  
  // Generate a demo user ID
  const demoUserId = `demo_${Date.now()}`;
  
  const [session, setSession] = useState<SimulationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationEnded, setSimulationEnded] = useState(false);
  const [score] = useState<number>(85);
  const [preparing, setPreparing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreparing(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const startSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🚀 Starting simulation...");
      console.log("API URL:", `${API}/livekit/create-session`);
      
      const response = await axios.post(`${API}/livekit/create-session`, {
        simulation_type: simulationId,
        age_verified: ageVerified
      });
      
      console.log("✅ Session created:", response.data);
      setSession(response.data);
    } catch (err: any) {
      console.error("❌ Full error:", err);
      console.error("❌ Response data:", err.response?.data);
      setError(err.response?.data?.error || `Failed to start simulation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const endSimulation = async () => {
    if (!session) return;

    try {
      console.log("🔚 Ending simulation...");
      console.log("API URL:", `${API}/livekit/end-session`);
      
      // End the LiveKit session
      await axios.post(`${API}/livekit/end-session`, {
        room_name: session.room_name,
        user_id: demoUserId
      });

      // Submit score for XP (optional for demo)
      try {
        await submitLesson({
          trackId: 'simulations',
          lessonId: simulationId,
          score: score,
          timeSpent: 180
        });
      } catch (e) {
        // Ignore XP submission errors in demo mode
        console.log("XP submission skipped for demo");
      }

      setSimulationEnded(true);
    } catch (err) {
      console.error("Error ending simulation:", err);
      // Don't fail the UI if ending fails
      setSimulationEnded(true);
    }
  };

  const getSimulationTitle = () => {
    const titles: Record<string, string> = {
      auto_driver_sim: "Auto Driver Negotiation",
      salary_negotiation_sim: "Salary Negotiation",
      crush_conversation_sim: "Coffee Date",
      road_rage_sim: "Road Incident Handler"
    };
    return titles[simulationId] || "Simulation";
  };

  // Preparation screen
  if (preparing) {
    return (
      <main className="flex flex-col items-center justify-center h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Getting Ready...</h2>
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-main flex items-center justify-center animate-pulse">
                <Phone className="h-8 w-8 text-main-foreground" />
              </div>
              <p className="text-muted-foreground">
                Preparing your {getSimulationTitle()} simulation
              </p>
            </div>
            <div className="space-y-2 text-sm text-left">
              <p>📱 Make sure your microphone is working</p>
              <p>🎧 Use headphones for better experience</p>
              <p>🗣️ Speak clearly and naturally</p>
              <p>💡 Don't worry about perfect pronunciation</p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Main simulation interface
  return (
    <main className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="default"
          size="sm"
          onClick={() => router.push('/simulations')}
          disabled={!!session && !simulationEnded}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">{getSimulationTitle()}</h1>
        <div className="text-sm text-green-600 font-medium">Live Mode</div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!session && !simulationEnded && (
          <div className="h-full flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Ready to Practice?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You'll have a voice conversation with an AI that plays the role of a {getSimulationTitle()}.
                  Speak naturally in Kannada!
                </p>
                
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                
                <Button
                  onClick={startSimulation}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Starting..." : "Start Conversation"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {session && !simulationEnded && (
          <VoiceConversation
            token={session.access_token}
            serverUrl={session.livekit_url}
            onDisconnect={endSimulation}
            simulationInfo={session.simulation}
          />
        )}

        {simulationEnded && (
          <div className="h-full flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                <h2 className="text-2xl font-bold mb-2">Great Job!</h2>
                <p className="text-muted-foreground mb-6">
                  You completed the {getSimulationTitle()} simulation
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="text-lg">
                    Score: <span className="font-bold">{score}%</span>
                  </div>
                  <div className="text-lg">
                    XP Earned: <span className="font-bold text-green-500">+{Math.floor(score * 1.5)}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/simulations')}
                    className="w-full"
                  >
                    Try Another Simulation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Practice Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}