// frontend/components/SentenceBuilding.tsx
"use client";

import { useState } from "react";
import { Lesson } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, CheckCircle2, XCircle } from "lucide-react";

interface SentenceBuildingProps {
  lesson: Lesson;
  onComplete?: (score: number) => void;
}

export default function SentenceBuilding({ lesson, onComplete }: SentenceBuildingProps) {
  const [availableWords, setAvailableWords] = useState<string[]>(lesson.content.word_bank || []);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const addWord = (word: string, index: number) => {
    const newAvailable = [...availableWords];
    newAvailable.splice(index, 1);
    setAvailableWords(newAvailable);
    setSelectedWords([...selectedWords, word]);
  };

  const removeWord = (word: string, index: number) => {
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
    setAvailableWords([...availableWords, word]);
  };

  const resetWords = () => {
    setAvailableWords(lesson.content.word_bank || []);
    setSelectedWords([]);
    setShowResult(false);
  };

  const checkAnswer = () => {
    const userSentence = selectedWords.join(" ");
    const correctSentence = lesson.content.correct_order?.join(" ") || "";
    const correct = userSentence === correctSentence;
    
    setIsCorrect(correct);
    setShowResult(true);
    setAttempts(attempts + 1);
    
    if (correct) {
      const score = Math.max(100 - (attempts * 10), 50);
      if (onComplete) {
        onComplete(score);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Build the Sentence</CardTitle>
        <CardDescription className="text-lg text-center">
          Translate: &ldquo;{lesson.content.english_sentence}&rdquo;
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Selected words area */}
        <div className="min-h-[80px] p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Your sentence:</p>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {selectedWords.length === 0 ? (
              <p className="text-muted-foreground italic">Click words below to build your sentence</p>
            ) : (
              selectedWords.map((word, index) => (
                <Button
                  key={`selected-${index}`}
                  variant="default"
                  size="sm"
                  onClick={() => removeWord(word, index)}
                  disabled={showResult && isCorrect}
                  className="text-base"
                >
                  {word}
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Available words */}
        <div className="p-4 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Available words:</p>
          <div className="flex flex-wrap gap-2">
            {availableWords.map((word, index) => (
              <Button
                key={`available-${index}`}
                variant="neutral"
                size="sm"
                onClick={() => addWord(word, index)}
                disabled={showResult && isCorrect}
                className="text-base"
              >
                {word}
              </Button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={resetWords}
            disabled={selectedWords.length === 0 || (showResult && isCorrect)}
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={checkAnswer}
            disabled={availableWords.length > 0 || showResult}
            className="flex-1"
          >
            Check Answer
          </Button>
        </div>

        {/* Result */}
        {showResult && (
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="text-green-500" />
                  <span className="font-bold text-green-700">Perfect!</span>
                </>
              ) : (
                <>
                  <XCircle className="text-red-500" />
                  <span className="font-bold text-red-700">Not quite right</span>
                </>
              )}
            </div>
            
            {!isCorrect && (
              <div>
                <p className="text-sm text-gray-700">Correct order:</p>
                <p className="font-semibold mt-1">
                  {lesson.content.correct_order?.join(" ")}
                </p>
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={resetWords}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            )}
            
            {isCorrect && (
              <p className="text-sm text-gray-700">
                {attempts === 1 ? "Excellent! First try! 🎉" : `Got it after ${attempts} attempts! 👍`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}