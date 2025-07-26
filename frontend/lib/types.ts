export interface Lesson {
    id: string;
    title: string;
    type: 'repeat_after_me' | 'mcq';
    content: {
      kannada_phrase?: string;
      english_translation?: string;
      pronunciation_guide?: string;
      question?: string;
      options?: string[];
      correct_answer?: string;
    };
  }
  
  export interface Simulation {
    id: string;
    name: string;
    description: string;
  }
  
  export interface Track {
    id: string;
    name: string;
    description: string;
    lessons: Lesson[];
    simulation: Simulation;
  }

export interface DuelRound {
  kannada: string;
  roman: string;
  letters: string[];
  image_base64: string;
}
