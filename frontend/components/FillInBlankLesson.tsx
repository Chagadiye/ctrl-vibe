// frontend/components/FillInBlankLesson.tsx
"use client";

import { useState } from "react";
import { Lesson } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useXPStore } from "@/store/xpStore";
import { CheckCircle2, XCircle } from "lucide-react";

interface FillInBlankLessonProps {
  lesson: Lesson;
  onComplete?: (score: number) => void;
}

export default function FillInBlankLesson({ lesson, onComplete }: FillInBlankLessonProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleOptionClick = (option: string) => {
    if (showResult) return;
    
    setSelectedOption(option);
    const correct = option === lesson.content.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (onComplete) {
      onComplete(correct ? 100 : 0);
    }
  };

  // Split the sentence at the blank
  const sentenceParts = lesson.content.sentence?.split("______") || ["", ""];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Fill in the Blank</CardTitle>
        <CardDescription className="text-lg">
          {lesson.content.english_hint}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Display the sentence with blank */}
        <div className="text-3xl font-bold text-center p-4 bg-muted rounded-lg">
          {sentenceParts[0]}
          <span className="inline-block min-w-[100px] border-b-2 border-foreground mx-2">
            {selectedOption || ""}
          </span>
          {sentenceParts[1]}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {lesson.content.options?.map((option) => (
            <Button
              key={option}
              variant={
                !showResult ? "neutral" :
                option === lesson.content.correct_answer ? "default" :
                option === selectedOption ? "noShadow" : "reverse"
              }
              className="h-auto py-4 text-lg"
              onClick={() => handleOptionClick(option)}
              disabled={showResult}
            >
              {option}
              {showResult && option === lesson.content.correct_answer && (
                <CheckCircle2 className="ml-2" />
              )}
              {showResult && option === selectedOption && !isCorrect && (
                <XCircle className="ml-2" />
              )}
            </Button>
          ))}
        </div>

        {/* Result message */}
        {showResult && (
          <div className={`text-center font-bold text-xl ${
            isCorrect ? 'text-green-500' : 'text-destructive'
          }`}>
            {isCorrect ? "Correct! Well done! 🎉" : `Not quite. The answer is: ${lesson.content.correct_answer}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}