import { create } from "zustand";
import axios from "axios";
import { API } from "@/lib/utils";
import { DuelRound } from "@/lib/types";

interface DuelStore {
    currentRound: DuelRound | null;
    currentRoundIndex: number;
    selectedLetters: string[];
    shuffledLetters: string[];
    gameState: "loading" | "playing" | "correct" | "wrong" | "gameOver";
    score: number;
    timeLeft: number;
    loading: boolean;
    error: string | null;

    // Actions
    fetchRound: (roundIndex: number) => Promise<void>;
    selectLetter: (letter: string) => void;
    submitAnswer: () => void;
    nextRound: () => void;
    resetGame: () => void;
    setTimeLeft: (time: number) => void;
}

function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export const useDuelStore = create<DuelStore>((set, get) => ({
    currentRound: null,
    currentRoundIndex: 0,
    selectedLetters: [],
    shuffledLetters: [],
    gameState: "loading",
    score: 0,
    timeLeft: 30,
    loading: false,
    error: null,

    fetchRound: async (roundIndex: number) => {
        // Set loading state immediately - this will trigger skeletons
        set({ 
            gameState: "loading",
            loading: true, 
            error: null,
        });

        try {
            const response = await axios.get<DuelRound>(`${API}/duel/round/${roundIndex}`);

            // Shuffle letters once and store them
            const shuffled = shuffle([...response.data.letters]);

            set({
                currentRound: response.data,
                shuffledLetters: shuffled,
                selectedLetters: [],
                gameState: "playing",
                timeLeft: 30,
                loading: false,
                error: null,
            });
        } catch (error: any) {
            if (roundIndex >= 5) {
                set({ gameState: "gameOver", loading: false });
            } else {
                set({ 
                    error: error.message || "Failed to fetch round",
                    loading: false,
                    gameState: "gameOver"
                });
            }
        }
    },

    selectLetter: (letter: string) => {
        const state = get();
        if (state.gameState !== "playing") return;

        set({
            selectedLetters: [...state.selectedLetters, letter]
        });
    },

    submitAnswer: () => {
        const state = get();
        if (!state.currentRound || state.gameState !== "playing") return;

        const guess = state.selectedLetters.join("");
        const isCorrect = guess === state.currentRound.kannada;

        set({
            gameState: isCorrect ? "correct" : "wrong",
            score: isCorrect ? state.score + 1 : state.score,
        });
    },

    nextRound: () => {
        const state = get();
        const nextIndex = state.currentRoundIndex + 1;

        if (nextIndex >= 5) {
            set({ gameState: "gameOver" });
        } else {
            set({ currentRoundIndex: nextIndex });
            state.fetchRound(nextIndex);
        }
    },

    resetGame: () => {
        set({
            currentRound: null,
            currentRoundIndex: 0,
            selectedLetters: [],
            shuffledLetters: [],
            gameState: "loading",
            score: 0,
            timeLeft: 30,
            loading: false,
            error: null,
        });
        get().fetchRound(0);
    },

    setTimeLeft: (time: number) => {
        set({ timeLeft: time });
    },
}));
