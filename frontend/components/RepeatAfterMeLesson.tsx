"use client";

import { Lesson } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Mic } from "lucide-react";

interface RepeatAfterMeLessonProps {
  lesson: Lesson;
}

export default function RepeatAfterMeLesson({ lesson }: RepeatAfterMeLessonProps) {

  const handlePlayAudio = () => {
    // TODO: Integrate with TTS client to play audio
    // For now, we can use the browser's speech synthesis for a demo
    const utterance = new SpeechSynthesisUtterance(lesson.content.kannada_phrase);
    utterance.lang = 'kn-IN'; // Set language to Kannada
    window.speechSynthesis.speak(utterance);
  };

  const handleRecord = () => {
    // TODO: Integrate with STT client to record and transcribe
    alert("Recording functionality will be added soon!");
  };

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-5xl font-bold mb-2">
          {lesson.content.kannada_phrase}
        </CardTitle>
        <CardDescription className="text-xl text-muted-foreground">
          "{lesson.content.english_translation}"
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <p className="text-lg">
          Pronunciation: <span className="font-mono bg-muted px-2 py-1 rounded">{lesson.content.pronunciation_guide}</span>
        </p>
        <div className="flex gap-4">
          <Button size="lg" onClick={handlePlayAudio}>
            <Volume2 className="mr-2" /> Play Audio
          </Button>
          <Button size="lg" onClick={handleRecord}>
            <Mic className="mr-2" /> Record
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
