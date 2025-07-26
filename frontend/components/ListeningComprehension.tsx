// frontend/components/ListeningComprehension.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Lesson } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import axios from "axios";

interface ListeningComprehensionProps {
  lesson: Lesson;
  onComplete?: (score: number) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969";

export default function ListeningComprehension({ lesson, onComplete }: ListeningComprehensionProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [playCount, setPlayCount] = useState(0);


  const generateAudio = useCallback(async () => {
    if (!lesson.content.audio_text) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/speech/synthesize`, {
        text: lesson.content.audio_text,
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
    // Generate audio on component mount
    generateAudio();
  }, [generateAudio]);

  const playAudio = () => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audio.play();
    setPlayCount(playCount + 1);
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === lesson.content.correct_answer;
    const score = isCorrect ? (playCount === 1 ? 100 : 80) : 0;
    
    if (onComplete) {
      onComplete(score);
    }
  };

  const getButtonVariant = (option: string) => {
    if (!showResult) return "neutral";
    if (option === lesson.content.correct_answer) return "default";
    if (option === selectedAnswer && option !== lesson.content.correct_answer) return "reverse";
    return "noShadow";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Listen and Answer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Audio Player Section */}
        <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
          <p className="text-center text-muted-foreground">
            Listen carefully to the audio and answer the question below
          </p>
          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={playAudio}
              disabled={loading || !audioUrl}
            >
              <Volume2 className="mr-2" />
              {playCount === 0 ? "Play Audio" : "Play Again"}
            </Button>
            {playCount > 2 && (
              <Button
                size="lg"
                variant="neutral"
                onClick={generateAudio}
                disabled={loading}
              >
                <RefreshCw className="mr-2" />
                Regenerate
              </Button>
            )}
          </div>
          {loading && <p className="text-sm text-muted-foreground">Generating audio...</p>}
        </div>

        {/* Question */}
        <div className="text-xl font-semibold text-center">
          {lesson.content.question}
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {lesson.content.options?.map((option) => (
            <Button
              key={option}
              variant={getButtonVariant(option)}
              className="w-full h-auto py-4 text-left justify-between"
              onClick={() => handleAnswerSelect(option)}
              disabled={showResult || playCount === 0}
            >
              <span>{option}</span>
              {showResult && option === lesson.content.correct_answer && (
                <CheckCircle2 className="ml-2 flex-shrink-0" />
              )}
              {showResult && option === selectedAnswer && option !== lesson.content.correct_answer && (
                <XCircle className="ml-2 flex-shrink-0" />
              )}
            </Button>
          ))}
        </div>

        {/* Play audio first message */}
        {playCount === 0 && (
          <p className="text-center text-muted-foreground">
            Please play the audio before selecting an answer
          </p>
        )}

        {/* Result */}
        {showResult && (
          <div className={`text-center font-bold text-xl ${
            selectedAnswer === lesson.content.correct_answer ? 'text-green-500' : 'text-destructive'
          }`}>
            {selectedAnswer === lesson.content.correct_answer 
              ? `Correct! ${playCount === 1 ? 'Perfect listening! 🎉' : 'Good job! 👍'}`
              : `Not quite. The correct answer is: "${lesson.content.correct_answer}"`
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}