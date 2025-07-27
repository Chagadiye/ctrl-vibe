// User and Progress Types
export interface User {
    _id: string;
    username: string;
    email?: string;
    xp: number;
    level: number;
    streak: number;
    completedLessons: string[];
    achievements: Achievement[];
    lastActive: Date;
    createdAt: Date;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    xpReward: number;
    unlockedAt?: Date;
}

export interface SimulationSession {
  room_name: string;
  access_token: string;
  livekit_url: string;
  simulation: {
    title: string;
    description: string;
    tips: string[];
  };
}
// Lesson Types
export type LessonType = 
    | "mcq" 
        | "repeat_after_me" 
            | "fill_in_blank" 
                | "word_matching" 
                    | "listening_comprehension" 
                        | "translation" 
                            | "sentence_building";

                            export interface Lesson {
                                id: string;
                                title: string;
                                type: LessonType;
                                content: LessonContent;
                            }

                            export interface LessonContent {
                                // MCQ
                                question?: string;
                                options?: string[];
                                correct_answer?: string | string[];
                                explanation?: string;

                                // Repeat After Me
                                kannada_phrase?: string;
                                english_translation?: string;
                                pronunciation_guide?: string;
                                audio_url?: string;

                                // Fill in Blank
                                sentence?: string;
                                english_hint?: string;

                                // Word Matching
                                pairs?: Array<{
                                    kannada: string;
                                    english: string;
                                }>;

                                // Listening Comprehension
                                audio_text?: string;

                                // Translation
                                direction?: "en_to_kn" | "kn_to_en";
                                source_text?: string;
                                correct_answers?: string[];
                                hints?: string[];

                                // Sentence Building
                                english_sentence?: string;
                                word_bank?: string[];
                                correct_order?: string[];
                            }

                            // Track and Simulation Types
                            export interface Track {
                                id: string;
                                name: string;
                                description: string;
                                difficulty: "beginner" | "intermediate" | "advanced";
                                lessons: Lesson[];
                                lesson_count?: number;
                                has_simulation?: boolean;
                                simulation?: Simulation;
                                content_warning?: boolean;
                                age_restricted?: boolean;
                            }

                            export interface Simulation {
                                id: string;
                                name: string;
                                description: string;
                                difficulty: "beginner" | "intermediate" | "advanced";
                                content_warning?: boolean;
                            }

                            // Game Progress Types
                            export interface LessonProgress {
                                userId: string;
                                trackId: string;
                                lessonId: string;
                                attempts: number;
                                bestScore: number;
                                completed: boolean;
                                completedAt?: Date;
                                timeSpent: number;
                            }

                            export interface GameSubmission {
                                userId: string;
                                trackId: string;
                                lessonId: string;
                                score: number;
                                timeSpent: number;
                                answers?: Record<string, unknown>; 
                            }


                            export interface GameResponse {
                                success: boolean;
                                xpEarned: number;
                                totalXp: number;
                                level: number;
                                levelUp: boolean;
                                streak: number;
                                newAchievements: Achievement[];
                                xpForNextLevel: number;
                                nextLevelTotal: number;
                                lessonCompleted: boolean;
                            }

                            // Simulation Types
                            export interface SimulationState {
                                text: string;
                                audioUrl: string;
                                history: ConversationMessage[];
                                endConversation?: boolean;
                                score?: number;
                                feedback?: Record<string, string>;
                            }

                            export interface ConversationMessage {
                                role: "system" | "user" | "assistant";
                                content: string;
                            }

                            // Leaderboard Types
                            export interface LeaderboardEntry {
                                username: string;
                                xp: number;
                                level: number;
                                streak: number;
                                rank?: number;
                            }

                            export interface PronunciationEvaluation {
                                accuracy_score: number;
                                feedback: string;
                                correct: boolean;
                            }

                            export interface DuelRound {
                                kannada: string;
                                roman: string;
                                letters: string[];
                                image_base64: string;
                            }
