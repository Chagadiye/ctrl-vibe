// frontend/app/simulations/[simulationId]/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardTitle, CardContent } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff, Volume2 } from "lucide-react"; 
import axios from "axios";
import { useXPStore } from "@/store/xpStore";
import { ConversationMessage } from "@/lib/types"; 
import { API } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
}

export default function SimulationPracticePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const simulationId = params.simulationId as string;
  const ageVerified = searchParams.get('age_verified') === 'true';
  
  const { userId } = useXPStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ConversationMessage[]>([]); // Fixed type
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simulationEnded, setSimulationEnded] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string> | null>(null); // Fixed type
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSimulation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/simulation/start`, {
        simulation_type: simulationId,
        user_id: userId,
        age_verified: ageVerified
      });
      
      const { text, audio_url, history: newHistory } = response.data;
      
      setMessages([{
        role: "assistant",
        content: text,
        audioUrl: audio_url
      }]);
      setHistory(newHistory);
      
      // Auto-play first message
      if (audio_url) {
        playAudio(audio_url);
      }
    } catch (error) {
      console.error("Error starting simulation:", error);
    } finally {
      setLoading(false);
    }
  }, [simulationId, userId, ageVerified])
  
  useEffect(() => {
    startSimulation();
  }, [startSimulation]);
  
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendUserMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to use this feature.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendUserMessage = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('data', JSON.stringify({
        simulation_type: simulationId,
        history: history,
        user_id: userId
      }));

      const response = await axios.post(`${API}/simulation/converse`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { text, audio_url, history: newHistory, end_conversation, score: simScore, feedback: simFeedback } = response.data;
      
      // Add user message (we don't show the actual text for now)
      setMessages(prev => [...prev, {
        role: "user",
        content: "🎤 Audio message"
      }]);
      
      // Add assistant response
      setMessages(prev => [...prev, {
        role: "assistant",
        content: text,
        audioUrl: audio_url
      }]);
      
      setHistory(newHistory);
      
      // Auto-play response
      if (audio_url) {
        playAudio(audio_url);
      }
      
      // Check if simulation ended
      if (end_conversation) {
        setSimulationEnded(true);
        setScore(simScore);
        setFeedback(simFeedback);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSimulationTitle = () => {
    const titles: Record<string, string> = {
      auto_driver_sim: "Auto Driver Negotiation",
      salary_negotiation_sim: "Salary Negotiation",
      crush_conversation_sim: "Coffee Date",
      road_rage_sim: "Road Incident"
    };
    return titles[simulationId] || "Simulation";
  };

  return (
    <main className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="default"
          size="sm"
          onClick={() => router.push('/simulations')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">{getSimulationTitle()}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[80%] ${
                message.role === 'user' ? 'bg-main text-main-foreground' : ''
              }`}>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-2">
                    {message.role === 'user' ? 'You' : 'AI'}
                  </p>
                  <p>{message.content}</p>
                  {message.audioUrl && (
                    <Button
                      size="sm"
                      variant="default"
                      className="mt-2"
                      onClick={() => playAudio(message.audioUrl!)}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
          
          {loading && (
            <div className="text-center text-muted-foreground">
              <p>Processing...</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      {!simulationEnded ? (
        <div className="p-4 border-t">
          <div className="max-w-2xl mx-auto flex justify-center">
            {!recording ? (
              <Button
                size="lg"
                onClick={startRecording}
                disabled={loading}
              >
                <Mic className="mr-2" />
                Hold to Talk
              </Button>
            ) : (
              <Button
                size="lg"
                variant="neutral"
                onClick={stopRecording}
              >
                <MicOff className="mr-2" />
                Release to Send
              </Button>
            )}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Click and hold to record your response
          </p>
        </div>
      ) : (
        /* Results */
        <Card className="m-4 p-6">
          <CardTitle className="text-center mb-4">Simulation Complete!</CardTitle>
          <div className="space-y-2 text-center">
            <p className="text-2xl font-bold">Score: {score}/100</p>
            {feedback && Object.entries(feedback).map(([key, value]) => (
              <p key={key} className="text-sm">
                {key}: {value as string}
              </p>
            ))}
            <Button
              className="mt-4"
              onClick={() => router.push('/simulations')}
            >
              Try Another Simulation
            </Button>
          </div>
        </Card>
      )}
    </main>
  );
}
