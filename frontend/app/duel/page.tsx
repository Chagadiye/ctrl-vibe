"use client";

import { useEffect } from "react";
import { useDuelStore } from "@/store/duelStore";
import { useXPStore } from "@/store/xpStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageCard from "@/components/ui/image-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Timer, Trophy, Target } from "lucide-react";

export default function DuelPage() {
    const {
        currentRound,
        currentRoundIndex,
        selectedLetters,
        shuffledLetters,
        gameState,
        score,
        timeLeft,
        error,
        selectLetter,
        submitAnswer,
        nextRound,
        resetGame,
        setTimeLeft,
    } = useDuelStore();
    const addDuelXP = useXPStore((s) => s.addDuelXP); // Use the new function

    // Initialize game
    useEffect(() => {
        resetGame();
    }, [resetGame]);

    // Timer countdown
    useEffect(() => {
        if (gameState === "playing" && timeLeft > 0) {
            const timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && gameState === "playing") {
            useDuelStore.setState({ gameState: "wrong" });
        }
    }, [timeLeft, gameState, setTimeLeft]);

    // Award XP when answer is correct
    useEffect(() => {
        if (gameState === "correct") {
            addDuelXP(10); // Use the new function
        }
    }, [gameState, addDuelXP]);

    const handleLetterClick = (letter: string) => {
        selectLetter(letter);
    };

    const handleSubmit = () => {
        submitAnswer();
    };

    const handleNext = () => {
        nextRound();
    };

    const isLetterDisabled = (letter: string) => {
        const letterCount = currentRound?.letters.filter(l => l === letter).length || 0;
        const selectedCount = selectedLetters.filter(l => l === letter).length;
        return selectedCount >= letterCount || gameState !== "playing";
    };

    if (gameState === "gameOver") {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen p-4 gap-6 text-center">
            <Card className="w-full max-w-md">
            <CardHeader>
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Game Over!
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="text-2xl font-bold">Final Score: {score}/5</div>
            <div className="text-lg text-muted-foreground">
            Total XP earned: {score * 10}
            </div>
            <Button onClick={resetGame} className="w-full">
            Play Again
            </Button>
            <Button 
            variant="neutral" 
            onClick={() => window.location.href = "/learn"}
            className="w-full"
            >
            Back to Learning
            </Button>
            </CardContent>
            </Card>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen p-4 gap-4 text-center">
            <Card className="w-full max-w-md">
            <CardContent className="pt-6">
            <p className="text-destructive text-lg mb-4">Error: {error}</p>
            <Button onClick={resetGame}>Try Again</Button>
            </CardContent>
            </Card>
            </main>
        );
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4 pt-20 gap-6">
        {/* Header with progress */}
        <div className="w-full max-w-xl flex justify-between items-center">
        <div className="flex items-center gap-2">
        <Target className="h-5 w-5" />
        <span className="font-bold">Round {currentRoundIndex + 1}/5</span>
        </div>
        <div className="flex items-center gap-2">
        <Timer className="h-5 w-5" />
        <span className={`font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
        {timeLeft}s
        </span>
        </div>
        <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5" />
        <span className="font-bold">Score: {score}</span>
        </div>
        </div>

        <Card className="w-full max-w-xl text-center">
        <CardHeader>
        <CardTitle className="text-2xl">
        Arrange the letters to spell the word
        </CardTitle>
        <p className="text-muted-foreground">Tap the letters in correct order</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
        {/* Image */}
        {gameState === "loading" || !currentRound ? (
            <div className="flex justify-center">
            <Skeleton className="w-full max-w-xs aspect-[4/3]" />
            </div>
        ) : (
        <div className="flex justify-center">
        <ImageCard 
        caption={currentRound.roman} 
        imageUrl={currentRound.image_base64}
        className="w-full max-w-xs"
        />
        </div>
        )}

        {/* Current selection display */}
        {gameState !== "loading" && (
            <div className="min-h-[3rem] p-4 border-2 border-border rounded-base bg-secondary-background">
            <div className="text-2xl font-mono">
            {selectedLetters.length > 0 ? selectedLetters.join("") : "⎯⎯⎯"}
            </div>
            </div>
        )}

        {/* Letter buttons */}
        {gameState === "loading" ? (
            <div className="flex flex-wrap justify-center gap-2">
            {[...Array(4)].map((_, idx) => (
                <Skeleton key={idx} className="w-12 h-10" />
            ))}
            </div>
        ) : shuffledLetters.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2">
        {shuffledLetters.map((letter, idx) => (
            <Button
            key={`${letter}-${idx}`}
            onClick={() => handleLetterClick(letter)}
            // FIX: Remove the second argument 'idx' from the function call
            disabled={isLetterDisabled(letter)}
            // FIX: Remove the second argument 'idx' from this call as well
            variant={isLetterDisabled(letter) ? "noShadow" : "neutral"}
            className="text-lg min-w-[3rem]"
            >
            {letter}
            </Button>
        ))}
        </div>
        ) : null}


        {/* Submit button */}


        {gameState === "loading" ? (
            <Skeleton className="w-full h-10" />
        ) : gameState === "playing" ? (
        <Button 
        onClick={handleSubmit} 
        disabled={selectedLetters.length === 0}
        className="w-full"
        >
        Submit Answer
        </Button>
        ) : null}



        {/* Feedback */}
        {gameState === "correct" && (
            <div className="text-green-600 font-bold text-xl">
            🎉 Correct! +10 XP
            </div>
        )}
        {gameState === "wrong" && (
            <div className="text-destructive font-bold text-xl">
            ❌ Not quite! Correct answer: {currentRound?.kannada}
            </div>
        )}

        {/* Next button */}
        {(gameState === "correct" || gameState === "wrong") && (
            <Button onClick={handleNext} className="w-full">
            {currentRoundIndex >= 4 ? "Finish Game" : "Next Round"}
            </Button>
        )}
        </CardContent>
        </Card>
        </main>
    );
}
