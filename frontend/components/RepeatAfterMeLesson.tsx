// frontend/components/RepeatAfterMeLesson.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PronunciationEvaluation } from "@/lib/types";
import { Lesson } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Mic, MicOff, CheckCircle2, RotateCcw } from "lucide-react";
import axios from "axios";

interface RepeatAfterMeLessonProps {
  lesson: Lesson;
  onComplete?: (score: number) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969";

export default function RepeatAfterMeLesson({ lesson, onComplete }: RepeatAfterMeLessonProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<PronunciationEvaluation | null>(null);
  const [playCount, setPlayCount] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);



  const generateAudio = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/speech/synthesize`, { 
      text: lesson.content.kannada_phrase, 
      voice: "alloy" 
      });
      setAudioUrl(response.data.audio_url); 
    } catch (error) {
      console.error("Error generating audio:", error); 
    } finally {
      setLoading(false);
    }
}, [lesson])

useEffect(() => {
  // Generate audio on mount
  generateAudio();
}, [generateAudio]);

  const handlePlayAudio = () => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audio.play();
    setPlayCount(playCount + 1);
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
        await evaluatePronunciation(audioBlob);
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

  const evaluatePronunciation = async (audioBlob: Blob) => {
    setEvaluating(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('original_text', lesson.content.kannada_phrase || '');

      const response = await axios.post(`${API_URL}/api/speech/evaluate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setEvaluation(response.data);
      
      // Submit score if pronunciation is acceptable
      if (response.data.correct && onComplete) {
        onComplete(response.data.accuracy_score);
      }
    } catch (error) {
      console.error("Error evaluating pronunciation:", error);
      setEvaluation({
        accuracy_score: 0,
        feedback: "Could not evaluate pronunciation. Please try again.",
        correct: false
      });
    } finally {
      setEvaluating(false);
    }
  };

  const resetLesson = () => {
    setEvaluation(null);
    setPlayCount(0);
  };

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-5xl font-bold mb-2">
          {lesson.content.kannada_phrase}
        </CardTitle>
        <CardDescription className="text-xl text-muted-foreground">
          &ldquo;{lesson.content.english_translation}&rdquo;
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <p className="text-lg">
          Pronunciation: <span className="font-mono bg-muted px-2 py-1 rounded">{lesson.content.pronunciation_guide}</span>
        </p>
        
        {/* Audio Controls */}
        <div className="flex gap-4">
          <Button 
            size="lg" 
            onClick={handlePlayAudio}
            disabled={loading || !audioUrl}
          >
            <Volume2 className="mr-2" />
            {playCount === 0 ? "Play Audio" : "Play Again"}
          </Button>
        </div>

        {/* Recording Controls */}
        {playCount > 0 && !evaluation && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">
              Now try saying it yourself!
            </p>
            {!recording ? (
              <Button 
                size="lg" 
                onClick={startRecording}
                disabled={evaluating}
                variant="default"
              >
                <Mic className="mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button 
                size="lg" 
                onClick={stopRecording}
                variant="neutral"
              >
                <MicOff className="mr-2" />
                Stop Recording
              </Button>
            )}
            {evaluating && <p className="text-sm text-muted-foreground">Evaluating your pronunciation...</p>}
          </div>
        )}

        {/* Evaluation Results */}
        {evaluation && (
          <div className={`w-full p-4 rounded-lg ${evaluation.correct ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {evaluation.correct ? (
                <>
                  <CheckCircle2 className="text-green-500" />
                  <span className="font-bold text-green-700">Great pronunciation!</span>
                </>
              ) : (
                <span className="font-bold text-yellow-700">Keep practicing!</span>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-lg">
                Accuracy: <span className="font-bold">{evaluation.accuracy_score}%</span>
              </p>
              <p className="text-sm text-gray-700">{evaluation.feedback}</p>
              
              {!evaluation.correct && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={resetLesson}
                  className="mt-3"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}