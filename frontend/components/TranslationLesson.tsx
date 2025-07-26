// frontend/components/TranslationLesson.tsx
"use client";

import { useState } from "react";
import { Lesson } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, CheckCircle2, XCircle } from "lucide-react";

interface TranslationLessonProps {
  lesson: Lesson;
  onComplete?: (score: number) => void;
}

export default function TranslationLesson({ lesson, onComplete }: TranslationLessonProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    
    const normalizedAnswer = userAnswer.trim().toLowerCase();
    const correctAnswers = lesson.content.correct_answers || [];
    const correct = correctAnswers.some(ans => ans.toLowerCase() === normalizedAnswer);
    
    setIsCorrect(correct);
    setShowResult(true);
    setAttempts(attempts + 1);
    
    if (correct) {
      // Score based on attempts and hint usage
      let score = 100;
      if (showHint) score -= 20;
      score -= (attempts - 1) * 10;
      score = Math.max(score, 50);
      
      if (onComplete) {
        onComplete(score);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult) {
      checkAnswer();
    }
  };

  const tryAgain = () => {
    setShowResult(false);
    setUserAnswer("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Translate {lesson.content.direction === "en_to_kn" ? "to Kannada" : "to English"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Source text */}
        <div className="p-6 bg-muted rounded-lg">
          <p className="text-2xl font-semibold text-center">
            {lesson.content.source_text}
          </p>
        </div>

        {/* Hint section */}
        {lesson.content.hints && lesson.content.hints.length > 0 && !showResult && (
          <div className="flex justify-center">
            {!showHint ? (
              <Button
                variant="noShadow"
                size="sm"
                onClick={() => setShowHint(true)}
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Show Hint
              </Button>
            ) : (
              <Card className="p-3 bg-yellow-50 border-yellow-200">
                <p className="text-sm">{lesson.content.hints[0]}</p>
              </Card>
            )}
          </div>
        )}

        {/* Input section */}
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Type your translation here..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={showResult && isCorrect}
            className="text-lg p-6"
          />
          
          {!showResult ? (
            <Button
              onClick={checkAnswer}
              disabled={!userAnswer.trim()}
              className="w-full"
              size="lg"
            >
              Check Answer
            </Button>
          ) : !isCorrect ? (
            <Button
              onClick={tryAgain}
              variant="neutral"
              className="w-full"
              size="lg"
            >
              Try Again
            </Button>
          ) : null}
        </div>

        {/* Result section */}
        {showResult && (
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="text-green-500" />
                  <span className="font-bold text-green-700">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="text-red-500" />
                  <span className="font-bold text-red-700">Not quite right</span>
                </>
              )}
            </div>
            
            {!isCorrect && (
              <div className="mt-2">
                <p className="text-sm text-gray-700">Possible answers:</p>
                <ul className="list-disc list-inside mt-1">
                  {lesson.content.correct_answers?.map((ans, idx) => (
                    <li key={idx} className="text-sm">{ans}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {isCorrect && (
              <p className="text-sm text-gray-700">
                {attempts === 1 && !showHint ? "Perfect! First try! 🎉" :
                 attempts === 1 && showHint ? "Good job! The hint helped! 👍" :
                 `Got it after ${attempts} attempts! Keep practicing! 💪`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}