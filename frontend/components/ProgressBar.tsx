// frontend/components/ProgressBar.tsx
"use client";

import { useXPStore } from "@/store/xpStore";
import { Card } from "@/components/ui/card";
import { Trophy, Flame, Star } from "lucide-react";

const LEVELS = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
  6: 2000,
  7: 3500,
  8: 5000,
  9: 7500,
  10: 10000
};

export default function ProgressBar() {
  const { username, xp, level, streak, hasHydrated } = useXPStore();

  if (!hasHydrated) return null;

  const currentLevelXP = LEVELS[level as keyof typeof LEVELS] || 0;
  const nextLevel = Math.min(level + 1, 10);
  const nextLevelXP = LEVELS[nextLevel as keyof typeof LEVELS] || 10000;
  const progressXP = xp - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const progressPercentage = level === 10 ? 100 : (progressXP / requiredXP) * 100;

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-bold">Level {level}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-500" />
            <span>{xp} XP</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span>{streak} day streak</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {username}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-main transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Level {level}</span>
        {level < 10 && (
          <span>{progressXP} / {requiredXP} XP to Level {nextLevel}</span>
        )}
        {level === 10 && <span>Max Level Reached! 🏆</span>}
      </div>
    </Card>
  );
}