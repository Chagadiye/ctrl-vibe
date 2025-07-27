// frontend/store/trackStore.ts
import { create } from "zustand";
import axios from "axios";
import { Track } from "@/lib/types";
import { API } from "@/lib/utils";

interface TrackStore {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  fetchTracks: () => Promise<void>;
  getTrackById: (trackId: string) => Track | undefined;
  getLessonById: (trackId: string, lessonId: string) => any;
}

export const useTrackStore = create<TrackStore>((set, get) => ({
  tracks: [],
  loading: false,
  error: null,
  
  fetchTracks: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<Track[]>(`${API}/tracks`);
      set({ tracks: res.data, loading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.error || err.message || "Failed to fetch tracks",
        loading: false 
      });
    }
  },
  
  getTrackById: (trackId: string) => {
    return get().tracks.find(track => track.id === trackId);
  },
  
  getLessonById: (trackId: string, lessonId: string) => {
    const track = get().getTrackById(trackId);
    if (!track) return null;
    return track.lessons.find(lesson => lesson.id === lessonId);
  }
}));
