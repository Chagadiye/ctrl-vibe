"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useLessonStore } from "@/store/lessonStore";
import MCQLesson from "@/components/MCQLesson";
import RepeatAfterMeLesson from "@/components/RepeatAfterMeLesson";

export default function LessonPage() {
  const rawParams = useParams();
  const trackId = Array.isArray(rawParams.trackId) ? rawParams.trackId[0] : rawParams.trackId;
  const lessonId = Array.isArray(rawParams.lessonId) ? rawParams.lessonId[0] : rawParams.lessonId;

  const { lesson, loading, error, fetchLesson, clear } = useLessonStore();

  useEffect(() => {
    if (trackId && lessonId) {
      fetchLesson(trackId, lessonId);
    }

    return () => clear(); // Clean up on unmount
  }, [trackId, lessonId]);

  if (!trackId || !lessonId) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-xl text-destructive">Invalid lesson URL.</p>
      </main>
    );
  }

  const renderLesson = () => {
    if (!lesson) return null;

    switch (lesson.type) {
      case "mcq":
        return <MCQLesson lesson={lesson} />;
      case "repeat_after_me":
        return <RepeatAfterMeLesson lesson={lesson} />;
      default:
        return <p>Unknown lesson type.</p>;
    }
  };

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
      <div className="w-full max-w-2xl">{renderLesson()}</div>
    </main>
  );
}
