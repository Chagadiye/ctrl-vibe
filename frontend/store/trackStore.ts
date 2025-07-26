import { create } from "zustand";
import axios from "axios";
import { Track } from "@/lib/types";

type TrackStore = {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  fetchTracks: () => Promise<void>;
};

export const useTrackStore = create<TrackStore>((set) => ({
  tracks: [],
  loading: false,
  error: null,
  fetchTracks: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<Track[]>("http://localhost:5001/api/tracks");
      set({ tracks: res.data });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },
}));
