"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Lesson } from "@/lib/types"; 

interface LessonCardProps {
    trackId: string;
    lesson: Lesson;
}

export default function LessonCard({ trackId, lesson }: LessonCardProps) {
    // The link now points to a dynamic route we will create later
    // e.g., /learn/survival/s1
    return (
        <Link href={`/learn/${trackId}/${lesson.id}`}>
        <Card className="text-center transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none">
        <h3 className="text-lg font-semibold">{lesson.title}</h3>
        </Card>
        </Link>
    );
}
