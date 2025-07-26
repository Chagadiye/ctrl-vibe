// frontend/store/leaderboardStore.ts
import { create } from "zustand";
import axios from "axios";
import { LeaderboardEntry } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969";

interface LeaderboardStore {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  userRank: number | null;
  loading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
  getUserRank: (userId: string) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardStore>((set) => ({
  entries: [],
  totalPlayers: 0,
  userRank: null,
  loading: false,
  error: null,

  fetchLeaderboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/api/game/leaderboard`);
      const { leaderboard, total_players } = response.data;
      
      // Add rank to each entry
      const rankedEntries = leaderboard.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1
      }));
      
      set({
        entries: rankedEntries,
        totalPlayers: total_players,
        loading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to fetch leaderboard",
        loading: false
      });
    }
  },

  getUserRank: async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/game/user/${userId}/progress`);
      const { stats } = response.data;
      set({ userRank: stats.global_rank });
    } catch (error) {
      console.error("Error fetching user rank:", error);
    }
  }
}));