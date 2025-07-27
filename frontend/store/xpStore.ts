// frontend/store/xpStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { API } from "@/lib/utils";

interface XPStore {
  // User data
  userId: string | null;
  username: string;
  xp: number;
  level: number;
  streak: number;
  achievements: string[];
  
  // UI state
  hasHydrated: boolean;
  loading: boolean;
  
  // Actions
  // Actions
  initUser: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  submitLesson: (data: {
    trackId: string;
    lessonId: string;
    score: number;
    timeSpent: number;
    answers?: any;
  }) => Promise<any>;
  addDuelXP: (amount: number) => void; // Add this new action
  loadUserProgress: () => Promise<void>;
  reset: () => void;
}

export const useXPStore = create<XPStore>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: null,
      username: "Guest",
      xp: 0,
      level: 1,
      streak: 0,
      achievements: [],
      hasHydrated: false,
      loading: false,

      // Initialize user (create guest if needed)
      initUser: async () => {
        const state = get();
        if (state.userId) {
          // User already exists, load their progress
          await state.loadUserProgress();
          return;
        }

        try {
          set({ loading: true });
          const response = await axios.post(`${API}/user/create-guest`);
          const { user_id, username, xp, level, streak } = response.data;
          
          set({
            userId: user_id,
            username,
            xp,
            level,
            streak,
            hasHydrated: true,
            loading: false
          });
        } catch (error) {
          console.error("Error creating user:", error);
          set({ loading: false, hasHydrated: true });
        }
      },

      // Update username
      updateUsername: async (newUsername: string) => {
        const { userId } = get();
        if (!userId) return;

        try {
          await axios.put(`${API}/user/update-username`, {
            user_id: userId,
            username: newUsername
          });
          set({ username: newUsername });
        } catch (error) {
          console.error("Error updating username:", error);
          throw error;
        }
      },

      // Submit lesson results
      submitLesson: async (data) => {
        const { userId } = get();
        if (!userId) {
          throw new Error("No user ID found");
        }

        try {
          set({ loading: true });
          const response = await axios.post(`${API}/game/submit-lesson`, {
            user_id: userId,
            ...data
          });

          const result = response.data;
          
          // Update local state with new values
          set({
            xp: result.total_xp,
            level: result.level,
            streak: result.streak,
            loading: false
          });

          // Add new achievements
          if (result.new_achievements?.length > 0) {
            const currentAchievements = get().achievements;
            const newAchievementIds = result.new_achievements.map((a: any) => a.id);
            set({
              achievements: [...currentAchievements, ...newAchievementIds]
            });
          }

          return result;
        } catch (error) {
          console.error("Error submitting lesson:", error);
          set({ loading: false });
          throw error;
        }
      },

      addDuelXP: (amount: number) => {
        const state = get();
        if (state.userId) {
          const newXP = state.xp + amount;
          set({ xp: newXP });
          // The 'persist' middleware will automatically save this to localStorage
        }
      },

      // Load user progress from server
      loadUserProgress: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
          set({ loading: true });
          const response = await axios.get(`${API}/user/profile/${userId}`);
          const userData = response.data;
          
          set({
            username: userData.username,
            xp: userData.xp || 0,
            level: userData.level || 1,
            streak: userData.streak || 0,
            achievements: userData.achievements || [],
            hasHydrated: true,
            loading: false
          });
        } catch (error) {
          console.error("Error loading user progress:", error);
          set({ loading: false, hasHydrated: true });
        }
      },

      // Reset store (for logout)
      reset: () => {
        set({
          userId: null,
          username: "Guest",
          xp: 0,
          level: 1,
          streak: 0,
          achievements: [],
          hasHydrated: false,
          loading: false
        });
      }
    }),
    {
      name: "kannada-user-storage",
      onRehydrateStorage: () => (state) => {
        state?.loadUserProgress();
      }
    }
  )
);
