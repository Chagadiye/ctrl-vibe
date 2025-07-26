import { create } from "zustand";
import axios from "axios";
import { Track, Lesson } from "@/lib/types";

type LessonStore = {
  lesson: Lesson | null;
  loading: boolean;
  error: string | null;
  fetchLesson: (trackId: string, lessonId: string) => Promise<void>;
  clear: () => void;
};

export const useLessonStore = create<LessonStore>((set) => ({
  lesson: null,
  loading: false,
  error: null,
  fetchLesson: async (trackId, lessonId) => {
    set({ loading: true, error: null, lesson: null });
    try {
      const response = await axios.get<Track>(
        `http://localhost:5001/api/tracks/${trackId}`
      );
      const currentLesson = response.data.lessons.find(
        (l) => l.id === lessonId
      );

      if (currentLesson) {
        set({ lesson: currentLesson });
      } else {
        set({ error: "Lesson not found in this track." });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },
  clear: () => set({ lesson: null, loading: false, error: null }),
}));
