// frontend/app/profile/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useXPStore } from "@/store/xpStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit2, Save, X, Trophy, Star, Flame, Target, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { API } from "@/lib/utils";

interface UserStats {
  global_rank: number;
  xp_to_next_level: number;
  level_progress_percentage: number;
  total_lessons_completed: number;
  perfect_lessons: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { userId, username, xp, level, streak, achievements, updateUsername } = useXPStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const fetchUserProgress = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API}/game/user/${userId}/progress`);
      setUserStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching user progress:", error);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserProgress();
  }, [fetchUserProgress]);

  const handleSaveUsername = async () => {
    if (newUsername === username) {
      setIsEditing(false);
      return;
    }
    try {
      await updateUsername(newUsername);
      setIsEditing(false);
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : "Failed to update username";
      alert(message);
      setNewUsername(username);
    }
  };

  const ACHIEVEMENT_DETAILS: Record<string, { icon: string; name: string; description: string }> = {
    first_lesson: { icon: "🎯", name: "First Steps", description: "Complete your first lesson" },
    streak_3: { icon: "🔥", name: "On Fire!", description: "Maintain a 3-day streak" },
    streak_7: { icon: "💪", name: "Week Warrior", description: "Maintain a 7-day streak" },
    perfect_10: { icon: "⭐", name: "Perfectionist", description: "Get perfect scores on 10 lessons" },
    night_owl: { icon: "🦉", name: "Night Owl", description: "Complete a lesson after 10 PM" },
    early_bird: { icon: "🐦", name: "Early Bird", description: "Complete a lesson before 7 AM" },
    simulation_master: { icon: "🗣️", name: "Conversation Pro", description: "Complete 5 simulations with high scores" },
    kannada_champion: { icon: "🏆", name: "Kannada Champion", description: "Reach level 10" }
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
          <h1 className="text-4xl font-bold flex-1 text-center">My Profile</h1>
        </div>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {!isEditing ? (
                <Button
                  size="sm"
                  variant="reverse"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveUsername}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setIsEditing(false);
                      setNewUsername(username);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
                className="max-w-sm"
              />
            ) : (
              <p className="text-2xl font-semibold">{username}</p>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{level}</p>
              <p className="text-sm text-muted-foreground">Level</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{xp.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total XP</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Flame className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{userStats?.total_lessons_completed || 0}</p>
              <p className="text-sm text-muted-foreground">Lessons Done</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements ({achievements.length}/8)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(ACHIEVEMENT_DETAILS).map(([id, details]) => {
                const isUnlocked = achievements.includes(id);
                return (
                  <div
                    key={id}
                    className={`p-4 rounded-lg border-2 ${
                      isUnlocked ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{details.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{details.name}</p>
                        <p className="text-sm text-muted-foreground">{details.description}</p>
                      </div>
                      {isUnlocked && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
