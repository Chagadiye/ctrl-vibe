"use client";

import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-5xl font-bold mb-4">Kannaḍagottā</h1>
      <p className="text-xl max-w-xl mb-6">
        Learn Kannada the fun, fast, and interactive way!
      </p>

      <div className="flex gap-4">
        <Button
          className="text-lg px-6 py-4"
          onClick={() => (window.location.href = "/learn")}
        >
          Start Learning
        </Button>
        <Button
          className="text-lg px-6 py-4"
          onClick={() => (window.location.href = "/duel")}
        >
          Language Duel
        </Button>
      </div>
    </section>
  );
}
