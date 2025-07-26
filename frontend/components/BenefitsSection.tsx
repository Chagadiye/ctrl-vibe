"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const benefits = [
  {
    title: "Quick Lessons",
    desc: "Short and simple lessons you can finish in minutes.",
  },
  {
    title: "Fun Practice",
    desc: "Interactive quizzes with instant feedback.",
  },
  {
    title: "Made for Beginners",
    desc: "Zero prior knowledge needed to get started.",
  },
  {
    title: "Speak Like a Local",
    desc: "Practical phrases you can actually use in Karnataka.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="bg-background py-20 px-4 text-center">
      <h2 className="text-4xl font-bold mb-12 text-foreground">
        Why Kannadanibba?
      </h2>
      <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
        {benefits.map((b, idx) => (
          // Using the Card component which already has neobrutalist styles
          // from your ui/card.tsx file (border, shadow).
          <Card
            key={idx}
            className="text-left"
          >
            <CardHeader>
              {/* CardTitle provides the bold, high-contrast heading */}
              <CardTitle className="text-2xl">{b.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* CardContent is used for the main description text */}
              <p className="text-foreground/90">{b.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
