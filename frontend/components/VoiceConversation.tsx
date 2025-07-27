// frontend/components/VoiceConversation.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import {
  LiveKitRoom,
  AudioConference,
  RoomAudioRenderer,
  useRoomContext,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  ConnectionState,
  useConnectionState,
  ControlBar,
  TrackToggle
} from "@livekit/components-react";
import { Track, Room, RoomEvent } from "livekit-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, Loader2, Phone, PhoneOff } from "lucide-react";
import "@livekit/components-styles";

interface VoiceConversationProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
  simulationInfo: any;
}

function ConversationRoom({ onDisconnect, simulationInfo }: { onDisconnect: () => void; simulationInfo: any }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const connectionState = useConnectionState();
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [transcript, setTranscript] = useState<Array<{speaker: string, text: string}>>([]);

  // Track remote participant audio activity
  const audioTracks = useTracks([Track.Source.Microphone], {
    updateOnlyOn: [RoomEvent.ActiveSpeakersChanged],
  });

  useEffect(() => {
    // Mark conversation as started when agent joins
    if (remoteParticipants.length > 0 && !conversationStarted) {
      setConversationStarted(true);
    }
  }, [remoteParticipants, conversationStarted]);

  useEffect(() => {
    // Monitor speaking activity
    const activeSpeakers = room.activeSpeakers;
    const agentSpeaking = activeSpeakers.some(speaker => 
      speaker.identity !== localParticipant.identity
    );
    setIsAgentSpeaking(agentSpeaking);
  }, [room.activeSpeakers, localParticipant]);

  const handleDisconnect = async () => {
    await room.disconnect();
    onDisconnect();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      {connectionState !== ConnectionState.Connected && (
        <div className="text-center p-4">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Connecting to conversation...</p>
        </div>
      )}

      {/* Main Content */}
      {connectionState === ConnectionState.Connected && (
        <>
          {/* Agent Status */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="relative mb-8">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isAgentSpeaking 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-gray-200'
              }`}>
                <Volume2 className={`h-16 w-16 ${isAgentSpeaking ? 'text-white' : 'text-gray-400'}`} />
              </div>
              {isAgentSpeaking && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <p className="text-sm font-semibold">AI is speaking...</p>
                </div>
              )}
            </div>

            {!conversationStarted ? (
              <p className="text-lg text-muted-foreground">Waiting for AI agent...</p>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">{simulationInfo.title}</h3>
                <p className="text-muted-foreground mb-6">{simulationInfo.description}</p>
                
                {/* Tips */}
                <Card className="w-full max-w-md mb-6">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Quick Tips:</h4>
                    <ul className="text-sm space-y-1">
                      {simulationInfo.tips?.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Audio Renderer - Hidden but necessary */}
          <RoomAudioRenderer />

          {/* Controls */}
          <div className="border-t p-4">
            <div className="max-w-md mx-auto flex items-center justify-center gap-4">
              <TrackToggle 
                source={Track.Source.Microphone}
                showIcon={false}
              >
                {({ enabled, pending, onClick }) => (
                  <Button
                    onClick={onClick}
                    disabled={pending}
                    variant={enabled ? "default" : "destructive"}
                    size="lg"
                    className="rounded-full w-16 h-16"
                  >
                    {enabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                  </Button>
                )}
              </TrackToggle>

              <Button
                onClick={handleDisconnect}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              {conversationStarted 
                ? "Speak naturally in Kannada. The AI will respond."
                : "Connecting to AI agent..."
              }
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function VoiceConversation({ token, serverUrl, onDisconnect, simulationInfo }: VoiceConversationProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connectOptions={{
        autoSubscribe: true,
        publishDefaults: {
          audioPreset: {
            maxBitrate: 32000,
          },
        },
      }}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: false,
        },
      }}
      audio={true}
      video={false}
      onDisconnected={onDisconnect}
      className="h-full"
    >
      <ConversationRoom onDisconnect={onDisconnect} simulationInfo={simulationInfo} />
    </LiveKitRoom>
  );
}