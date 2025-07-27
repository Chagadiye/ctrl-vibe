// frontend/components/VoiceConversation.tsx
"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  useConnectionState,
  useDataChannel,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneOff } from "lucide-react";

// ... (interface VoiceConversationProps remains the same)
interface VoiceConversationProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
  simulationInfo: {
    title: string;
    description: string;
    tips: string[];
  };
}


function VoiceInterface({ onDisconnect, simulationInfo }: { 
  onDisconnect: () => void; 
  simulationInfo: VoiceConversationProps['simulationInfo'] 
}) {
  const { state, audioTrack } = useVoiceAssistant();
  const connectionState = useConnectionState();
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const { message } = useDataChannel();
  
  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      setIsConnected(true);
    }
  }, [connectionState]);

  useEffect(() => {
    if (message) {
      try {
        // ++ FIX: Decode the Uint8Array payload to a string before parsing
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(message.payload);
        const data = JSON.parse(jsonString);

        if (data.type === 'transcript') {
          setTranscript(prev => [...prev.slice(-5), data.content]);
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }, [message]);

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return "text-green-600";
      case ConnectionState.Connecting:
        return "text-yellow-600";
      case ConnectionState.Disconnected:
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return "Connected";
      case ConnectionState.Connecting:
        return "Connecting...";
      case ConnectionState.Disconnected:
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{simulationInfo.title}</h2>
            <p className={`text-sm ${getConnectionStatusColor()}`}>
              {getConnectionStatusText()}
            </p>
          </div>
          <Button
            variant="reverse"
            size="sm"
            onClick={onDisconnect}
            className="flex items-center gap-2"
          >
            <PhoneOff className="h-4 w-4" />
            End Call
          </Button>
        </div>
      </div>

      {/* Main Voice Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50">
        {!isConnected ? (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
              <Phone className="h-12 w-12 text-blue-600" />
            </div>
            <p className="text-lg text-gray-600">Connecting to your simulation...</p>
          </div>
        ) : (
          <div className="text-center space-y-6">
            {/* Voice Visualizer */}
            <div className="w-32 h-32 mx-auto">
              {audioTrack && (
                <BarVisualizer 
                  state={state}
                  barCount={12}
                  trackRef={audioTrack}
                  className="w-full h-full"
                />
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <p className="text-xl font-medium text-gray-800">
                {state === 'listening' ? '🎤 Listening...' : 
                 state === 'thinking' ? '🤔 Processing...' :
                 state === 'speaking' ? '🗣️ Speaking...' : 
                 '💬 Ready to chat'}
              </p>
              <p className="text-sm text-gray-600">
                Speak naturally in Kannada mixed with English
              </p>
            </div>

            {/* Recent Transcript */}
            {transcript.length > 0 && (
              <Card className="max-w-md mx-auto">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium mb-2">Recent conversation:</h4>
                  <div className="space-y-1 text-sm">
                    {transcript.map((msg, idx) => (
                      <p key={idx} className="text-gray-700">{msg}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="p-4 bg-gray-50 border-t">
        <h4 className="text-sm font-medium mb-2">💡 Tips:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          {simulationInfo.tips.map((tip, idx) => (
            <li key={idx}>• {tip}</li>
          ))}
        </ul>
      </div>

      {/* Audio renderer for playback */}
      <RoomAudioRenderer />
    </div>
  );
}


export default function VoiceConversation({ 
  token, 
  serverUrl, 
  onDisconnect, 
  simulationInfo 
}: VoiceConversationProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={onDisconnect}
      className="h-full"
    >
      <VoiceInterface onDisconnect={onDisconnect} simulationInfo={simulationInfo} />
    </LiveKitRoom>
  );
}
