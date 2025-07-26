// frontend/app/learn/[trackId]/[lessonId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLessonStore } from "@/store/lessonStore";
import { useXPStore } from "@/store/xpStore";
import { useTrackStore } from "@/store/trackStore";
import MCQLesson from "@/components/MCQLesson";
import RepeatAfterMeLesson from "@/components/RepeatAfterMeLesson";
import FillInBlankLesson from "@/components/FillInBlankLesson";
import WordMatchingLesson from "@/components/WordMatchingLesson";
import ListeningComprehension from "@/components/ListeningComprehension";
import TranslationLesson from "@/components/TranslationLesson";
import SentenceBuilding from "@/components/SentenceBuilding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Trophy } from "lucide-react";
import { GameResponse, Achievement } from "@/lib/types"; 



export default function LessonPage() {
  const router = useRouter();
  const rawParams = useParams();
  const trackId = Array.isArray(rawParams.trackId) ? rawParams.trackId[0] : rawParams.trackId;
  const lessonId = Array.isArray(rawParams.lessonId) ? rawParams.lessonId[0] : rawParams.lessonId;
  const { lesson, loading, error, fetchLesson, clear } = useLessonStore();
  const { userId, submitLesson } = useXPStore();
  const { getTrackById } = useTrackStore();

  const [lessonScore, setLessonScore] = useState<number | null>(null);
  const [timeStarted] = useState(Date.now());
  const [gameResult, setGameResult] = useState<GameResponse | null>(null); // Fixed type

  useEffect(() => {
    if (trackId && lessonId) {
      fetchLesson(trackId, lessonId);
    }
    return () => clear();
  }, [trackId, lessonId, fetchLesson, clear]); // Fixed dependencies

  const handleLessonComplete = async (score: number) => {
    setLessonScore(score);
    if (!userId || !trackId || !lessonId) return;
    const timeSpent = Math.floor((Date.now() - timeStarted) / 1000);
    try {
      const result = await submitLesson({
        trackId,
        lessonId,
        score,
        timeSpent
      });
      setGameResult(result);
    } catch (err) {
      console.error("Error submitting lesson:", err);
    }
  };

  const getNextLesson = () => {
    // FIX: Ensure trackId exists before getting the track
    if (!trackId) return null;
    const track = getTrackById(trackId);
    if (!track) return null;
    const currentIndex = track.lessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1 || currentIndex === track.lessons.length - 1) return null;
    return track.lessons[currentIndex + 1];
  };

  const getPreviousLesson = () => {
    // FIX: Ensure trackId exists before getting the track
    if (!trackId) return null;
    const track = getTrackById(trackId);
    if (!track) return null;
    
    const currentIndex = track.lessons.findIndex(l => l.id === lessonId);
    if (currentIndex <= 0) return null;
    return track.lessons[currentIndex - 1];
  };

  const renderLesson = () => {
    if (!lesson) return null;
    const commonProps = {
      lesson,
      onComplete: handleLessonComplete
    };
    switch (lesson.type) {
      case "mcq":
        return <MCQLesson {...commonProps} />;
      case "repeat_after_me":
        return <RepeatAfterMeLesson {...commonProps} />;
      case "fill_in_blank":
        return <FillInBlankLesson {...commonProps} />;
      case "word_matching":
        return <WordMatchingLesson {...commonProps} />;
      case "listening_comprehension":
        return <ListeningComprehension {...commonProps} />;
      case "translation":
        return <TranslationLesson {...commonProps} />;
      case "sentence_building":
        return <SentenceBuilding {...commonProps} />;
      default:
        return <p>Unknown lesson type: {lesson.type}</p>;
    }
  };

  if (!trackId || !lessonId) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-xl text-destructive">Invalid lesson URL.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-xl">Loading Lesson...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-xl text-destructive">Error: {error}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-4 pt-20">
      <div className="w-full max-w-2xl">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="default"
            onClick={() => router.push('/learn')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tracks
          </Button>
          
          <div className="flex gap-2">
            {getPreviousLesson() && (
              <Button
                variant="neutral"
                size="sm"
                onClick={() => router.push(`/learn/${trackId}/${getPreviousLesson()!.id}`)}
              >
                Previous
              </Button>
            )}
            {getNextLesson() && (
              <Button
                variant="neutral"
                size="sm"
                onClick={() => router.push(`/learn/${trackId}/${getNextLesson()!.id}`)}
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Lesson Content */}
        {!gameResult ? (
          renderLesson()
        ) : (
          /* Results Screen */
          <Card className="p-8 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-main" />
            <h2 className="text-3xl font-bold mb-4">
              {gameResult.lessonCompleted ? "Lesson Complete!" : "Good Try!"}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="text-xl">
                Score: <span className="font-bold">{lessonScore}%</span>
              </div>
              
              <div className="text-lg">
                XP Earned: <span className="font-bold text-green-500">+{gameResult.xpEarned}</span>
              </div>
              
              <div className="text-lg">
                Total XP: <span className="font-bold">{gameResult.totalXp}</span>
              </div>
              
              {gameResult.levelUp && (
                <div className="text-xl font-bold text-main animate-bounce">
                  🎉 Level Up! You&apos;re now Level {gameResult.level}!
                </div>
              )}
              
              {gameResult.newAchievements?.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-bold mb-2">New Achievements!</h3>
                {gameResult.newAchievements.map((achievement: Achievement) => ( // Fixed type
                  <div key={achievement.id} className="flex items-center gap-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold">{achievement.name}</p>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
            
            <div className="flex gap-3 justify-center">
              {getNextLesson() ? (
                <Button
                  size="lg"
                  onClick={() => router.push(`/learn/${trackId}/${getNextLesson()!.id}`)}
                >
                  Next Lesson
                  <ArrowRight className="ml-2" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => router.push('/learn')}
                >
                  Back to Tracks
                </Button>
              )}
              
              <Button
                variant="neutral"
                size="lg"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}