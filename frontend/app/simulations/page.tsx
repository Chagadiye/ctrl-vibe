// frontend/app/simulations/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, Briefcase, Heart, AlertTriangle } from "lucide-react";
import { useState } from "react";

const SIMULATIONS = [
  {
    id: "auto_driver_sim",
    title: "Auto Driver Negotiation",
    description: "Practice bargaining for a fair auto fare",
    icon: Car,
    difficulty: "intermediate",
    xpReward: 100
  },
  {
    id: "salary_negotiation_sim",
    title: "Salary Negotiation",
    description: "Simulate a conversation with your manager",
    icon: Briefcase,
    difficulty: "advanced",
    xpReward: 150
  },
  {
    id: "crush_conversation_sim",
    title: "Coffee Date",
    description: "Practice casual conversation with someone you like",
    icon: Heart,
    difficulty: "intermediate",
    xpReward: 100
  },
  {
    id: "road_rage_sim",
    title: "Road Incident Handler",
    description: "Learn to de-escalate tense traffic situations",
    icon: AlertTriangle,
    difficulty: "advanced",
    xpReward: 200,
    ageRestricted: true
  }
];

export default function SimulationsPage() {
  const router = useRouter();
  const [showAgeWarning, setShowAgeWarning] = useState(false);
  const [selectedSim, setSelectedSim] = useState<string | null>(null);

  const handleSimulationClick = (simId: string, ageRestricted?: boolean) => {
    if (ageRestricted) {
      setSelectedSim(simId);
      setShowAgeWarning(true);
    } else {
      router.push(`/simulations/${simId}`);
    }
  };

  const confirmAge = () => {
    if (selectedSim) {
      router.push(`/simulations/${selectedSim}?age_verified=true`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-600";
      case "intermediate":
        return "text-yellow-600";
      case "advanced":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="neutral"
            onClick={() => router.push('/learn')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Learn
          </Button>
          <h1 className="text-4xl font-bold flex-1 text-center">Practice Simulations</h1>
        </div>

        {/* Instructions */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h2 className="font-bold text-lg mb-2">How it works:</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Choose a real-life scenario to practice</li>
              <li>Have a voice conversation with an AI character</li>
              <li>Earn XP based on your performance</li>
              <li>Improve your conversational Kannada skills</li>
            </ul>
          </CardContent>
        </Card>

        {/* Simulations Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {SIMULATIONS.map((sim) => {
            const Icon = sim.icon;
            return (
              <Card
                key={sim.id}
                className="cursor-pointer transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                onClick={() => handleSimulationClick(sim.id, sim.ageRestricted)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Icon className="h-8 w-8 text-main" />
                    <span className={`text-sm font-semibold ${getDifficultyColor(sim.difficulty)}`}>
                      {sim.difficulty}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{sim.title}</CardTitle>
                  <CardDescription>{sim.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Reward: {sim.xpReward} XP
                    </span>
                    {sim.ageRestricted && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        18+
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Age Verification Modal */}
        {showAgeWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Age Verification Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This simulation contains content that may include strong language 
                  used in emergency situations. It&apos;s designed to help you handle 
                  difficult real-world scenarios.
                </p>
                <p className="font-semibold">
                  Are you 18 years or older?
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={confirmAge}
                    className="flex-1"
                  >
                    Yes, I&apos;m 18+
                  </Button>
                  <Button
                    variant="neutral"
                    onClick={() => setShowAgeWarning(false)}
                    className="flex-1"
                  >
                    No, go back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}