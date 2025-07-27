"use client";

import * as React from "react";
import axios from "axios";
import { Button, buttonVariants } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";
import { Volume2, Loader2 } from "lucide-react";
import { API } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ConsciousButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  kannadaText: string;
  romanText?: string;
  // Prevents the main button onClick from firing when TTS icon is clicked
  onTTSClick?: (e: React.MouseEvent) => Promise<void>;
}

const ConsciousButton = React.forwardRef<
  HTMLButtonElement,
  ConsciousButtonProps
>(
  (
    {
      className,
      variant,
      size,
      kannadaText,
      romanText,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const [isPlaying, setIsPlaying] = React.useState(false);

    const handleTTSClick = async (e: React.MouseEvent) => {
      // Stop event from bubbling up to the main button's onClick
      e.stopPropagation();
      if (isPlaying) return;

      setIsPlaying(true);
      try {
        const response = await axios.post(`${API}/speech/synthesize`, {
          text: kannadaText,
          voice: "alloy", // You can parameterize this later if needed
        });
        const audio = new Audio(response.data.audio_url);
        
        // Wait for audio to finish playing
        await new Promise((resolve) => {
          audio.onended = resolve;
          audio.onerror = (err) => {
            console.error("Audio playback error:", err);
            resolve(err);
          };
          audio.play();
        });

      } catch (err) {
        console.error("Failed to fetch or play audio for:", kannadaText, err);
      } finally {
        setIsPlaying(false);
      }
    };

    return (
      <Button
        className={cn(
          "h-auto justify-center p-3", // Set height to auto for vertical content
          className
        )}
        variant={variant}
        size={size}
        onClick={onClick} // Pass through original onClick
        ref={ref}
        {...props}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{kannadaText}</span>
            <div
              className="cursor-pointer rounded-full p-1 hover:bg-black/10"
              onClick={handleTTSClick}
            >
              {isPlaying ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Volume2 />
              )}
            </div>
          </div>
          {romanText && (
            <span className="text-xs font-normal opacity-80 pointer-events-none">
              {romanText}
            </span>
          )}
        </div>
      </Button>
    );
  }
);

ConsciousButton.displayName = "ConsciousButton";

export { ConsciousButton };
