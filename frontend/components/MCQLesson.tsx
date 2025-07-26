"use client";

import { useState } from "react";
import { Lesson } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useXPStore } from "@/store/xpStore";
import { CheckCircle2, XCircle } from "lucide-react";

interface MCQLessonProps {
  lesson: Lesson;
}

export default function MCQLesson({ lesson }: MCQLessonProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const addXP = useXPStore((state) => state.addXP);

  const handleOptionClick = (option: string) => {
    if (selectedOption) return; // Prevent changing answer

    const correct = option === lesson.content.correct_answer;
    setSelectedOption(option);
    setIsCorrect(correct);

    if (correct) {
      addXP(10); // Award 10 XP for a correct answer
    }
  };

  const getButtonVariant = (option: string) => {
    if (!selectedOption) return "neutral";
    if (option === lesson.content.correct_answer) return "default";
    if (option === selectedOption && !isCorrect) return "destructive";
    return "outline";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">{lesson.content.question}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {lesson.content.options?.map((option) => (
          <Button
            key={option}
            variant={getButtonVariant(option)}
            className="h-auto py-4 text-lg justify-between"
            onClick={() => handleOptionClick(option)}
            disabled={!!selectedOption}
          >
            {option}
            {selectedOption && option === lesson.content.correct_answer && <CheckCircle2 />}
            {selectedOption && option === selectedOption && !isCorrect && <XCircle />}
          </Button>
        ))}
        {isCorrect !== null && (
          <div className={`mt-4 text-center font-bold text-xl ${isCorrect ? 'text-green-500' : 'text-destructive'}`}>
            {isCorrect ? "Correct! +10 XP" : "Not quite, try the next one!"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
