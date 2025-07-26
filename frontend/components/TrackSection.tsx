"use client";

import LessonCard from "./LessonCard";
import { Track } from "@/lib/types"; // Import our type

// The component now accepts a single 'track' object
export default function TrackSection({ track }: { track: Track }) {
  return (
    <section className="my-8 px-4 w-full max-w-5xl">
      <h2 className="text-2xl font-bold mb-2 capitalize text-center">{track.name}</h2>
      <p className="text-muted-foreground text-center mb-4">{track.description}</p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mx-auto">
        {track.lessons.map((lesson) => (
          // Pass the track's ID and the full lesson object to the card
          <LessonCard key={lesson.id} trackId={track.id} lesson={lesson} />
        ))}
      </div>
    </section>
  );
}
