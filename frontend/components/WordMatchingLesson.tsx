// frontend/components/WordMatchingLesson.tsx
"use client";

import { useState, useEffect } from "react";
import { Lesson } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

interface WordMatchingLessonProps {
  lesson: Lesson;
  onComplete?: (score: number) => void;
}

interface WordCard {
  id: string;
  text: string;
  language: "kannada" | "english";
  pairId: number;
}

export default function WordMatchingLesson({ lesson, onComplete }: WordMatchingLessonProps) {
  const [cards, setCards] = useState<WordCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<WordCard | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [incorrectPair, setIncorrectPair] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Initialize cards from pairs
    if (lesson.content.pairs) {
      const newCards: WordCard[] = [];
      lesson.content.pairs.forEach((pair, index) => {
        newCards.push({
          id: `k-${index}`,
          text: pair.kannada,
          language: "kannada",
          pairId: index
        });
        newCards.push({
          id: `e-${index}`,
          text: pair.english,
          language: "english",
          pairId: index
        });
      });
      // Shuffle cards
      setCards(newCards.sort(() => Math.random() - 0.5));
    }
  }, [lesson]);

  const handleCardClick = (card: WordCard) => {
    if (matchedPairs.has(card.pairId) || incorrectPair.has(card.id)) return;

    if (!selectedCard) {
      setSelectedCard(card);
      setIncorrectPair(new Set());
    } else {
      if (selectedCard.id === card.id) {
        // Clicking the same card, deselect
        setSelectedCard(null);
      } else if (selectedCard.pairId === card.pairId && selectedCard.language !== card.language) {
        // Correct match!
        const newMatched = new Set(matchedPairs);
        newMatched.add(card.pairId);
        setMatchedPairs(newMatched);
        setSelectedCard(null);
        
        // Check if all pairs are matched
        if (newMatched.size === lesson.content.pairs!.length) {
          const score = Math.max(100 - (attempts * 5), 50); // Deduct 5 points per wrong attempt
          setIsComplete(true);
          if (onComplete) {
            onComplete(score);
          }
        }
      } else {
        // Incorrect match
        setIncorrectPair(new Set([selectedCard.id, card.id]));
        setAttempts(attempts + 1);
        setTimeout(() => {
          setSelectedCard(null);
          setIncorrectPair(new Set());
        }, 1000);
      }
    }
  };

  const getCardStyle = (card: WordCard) => {
    if (matchedPairs.has(card.pairId)) return "default";
    if (incorrectPair.has(card.id)) return "default";
    if (selectedCard?.id === card.id) return "default";
    return "neutral";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Match the Words</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-center">ಕನ್ನಡ</h3>
            {cards
              .filter(card => card.language === "kannada")
              .map(card => (
                <Button
                  key={card.id}
                  variant={getCardStyle(card)}
                  className="w-full h-auto py-3 text-lg"
                  onClick={() => handleCardClick(card)}
                  disabled={matchedPairs.has(card.pairId)}
                >
                  {card.text}
                  {matchedPairs.has(card.pairId) && <CheckCircle2 className="ml-2" />}
                  {incorrectPair.has(card.id) && <XCircle className="ml-2" />}
                </Button>
              ))}
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-center">English</h3>
            {cards
              .filter(card => card.language === "english")
              .map(card => (
                <Button
                  key={card.id}
                  variant={getCardStyle(card)}
                  className="w-full h-auto py-3 text-lg"
                  onClick={() => handleCardClick(card)}
                  disabled={matchedPairs.has(card.pairId)}
                >
                  {card.text}
                  {matchedPairs.has(card.pairId) && <CheckCircle2 className="ml-2" />}
                  {incorrectPair.has(card.id) && <XCircle className="ml-2" />}
                </Button>
              ))}
          </div>
        </div>

        {isComplete && (
          <div className="mt-6 text-center">
            <p className="text-xl font-bold text-green-500">
              Excellent! All pairs matched! 🎉
            </p>
            <p className="text-muted-foreground">
              Wrong attempts: {attempts}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}