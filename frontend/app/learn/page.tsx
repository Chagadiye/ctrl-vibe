// frontend/app/learn/page.tsx
"use client";

import { useEffect } from "react";
import TrackSection from "@/components/TrackSection";
import ProgressBar from "@/components/ProgressBar";
import { useXPStore } from "@/store/xpStore";
import { useTrackStore } from "@/store/trackStore";
import { Button } from "@/components/ui/button";
import { Trophy, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LearnPage() {
  const router = useRouter();
  const { hasHydrated, initUser } = useXPStore();
  const { tracks, loading, error, fetchTracks } = useTrackStore();

  useEffect(() => {
    // Initialize user and load tracks
    const init = async () => {
      await initUser();
      await fetchTracks();
    };
    init();
  }, [initUser, fetchTracks]);

  if (loading || !hasHydrated) {
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
        <p className="text-muted-foreground mt-2">Please make sure the backend server is running on port 5001.</p>
        <Button 
          className="mt-4" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-4">
      <div className="w-full max-w-5xl">
        {/* Header with Progress */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-center">Choose a Lesson</h1>
          <ProgressBar />
          
          {/* Quick Actions */}
          <div className="flex justify-center gap-4 mt-4">
            <Button
              variant="default"
              onClick={() => router.push('/leaderboard')}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </Button>
            <Button
              variant="default"
              onClick={() => router.push('/profile')}
            >
              <Users className="mr-2 h-4 w-4" />
              My Profile
            </Button>
          </div>
        </div>

        {/* Track Sections */}
        {tracks.map((track) => (
          <TrackSection key={track.id} track={track} />
        ))}
        
        {/* Simulations Section */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready for Real Conversations?</h2>
          <p className="text-muted-foreground mb-6">
            Practice your Kannada with AI-powered simulations
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/simulations')}
          >
            Start Simulations
          </Button>
        </div>
      </div>
    </main>
  );
}