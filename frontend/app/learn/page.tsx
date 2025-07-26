"use client";

import { useEffect } from "react";
import TrackSection from "@/components/TrackSection";
import { useXPStore } from "@/store/xpStore";
import { useTrackStore } from "@/store/trackStore";

export default function LearnPage() {
  const { xp, hasHydrated, loadXP } = useXPStore();
  const { tracks, loading, error, fetchTracks } = useTrackStore();

  useEffect(() => {
    loadXP(); // Load XP from localStorage after hydration
    fetchTracks();
  }, [loadXP, fetchTracks]);

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-xl">Loading Kannada lessons...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-xl text-destructive">Error loading lessons: {error}</p>
        <p>Please make sure the backend server is running correctly.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">Choose a Lesson</h1>
      <p className="text-muted-foreground mb-8">
        Total XP: {hasHydrated ? xp : 0}
      </p>

      {tracks.map((track) => (
        <TrackSection key={track.id} track={track} />
      ))}
    </main>
  );
}
