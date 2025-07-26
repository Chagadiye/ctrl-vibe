// frontend/app/leaderboard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import { useXPStore } from "@/store/xpStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, ArrowLeft } from "lucide-react";

export default function LeaderboardPage() {
  const router = useRouter();
  const { entries, totalPlayers, userRank, loading, fetchLeaderboard, getUserRank } = useLeaderboardStore();
  const { userId, username } = useXPStore();

  useEffect(() => {
    fetchLeaderboard();
    if (userId) {
      getUserRank(userId);
    }
  }, [userId, fetchLeaderboard, getUserRank]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="font-bold text-lg">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-50 border-yellow-300";
      case 2:
        return "bg-gray-50 border-gray-300";
      case 3:
        return "bg-orange-50 border-orange-300";
      default:
        return "";
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="default"
            onClick={() => router.push('/learn')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Learn
          </Button>
          <h1 className="text-4xl font-bold flex-1 text-center">Leaderboard</h1>
        </div>

        {/* User's Rank Card */}
        {userRank && (
          <Card className="mb-6 bg-main text-main-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Your Rank</p>
                  <p className="text-3xl font-bold">#{userRank}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{username}</p>
                  <p className="text-sm opacity-90">out of {totalPlayers} players</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Loading leaderboard...</p>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div
                    key={entry.username}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${getRankStyle(entry.rank || index + 1)}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 flex justify-center">
                        {getRankIcon(entry.rank || index + 1)}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {entry.username}
                          {entry.username === username && (
                            <span className="text-sm text-muted-foreground ml-2">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Level {entry.level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.xp.toLocaleString()} XP</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.streak} day streak
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mt-6 text-center text-muted-foreground">
          <p>Total Players: {totalPlayers}</p>
        </div>
      </div>
    </main>
  );
}