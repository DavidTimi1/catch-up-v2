"use client";

import React, { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX, Play, Pause } from "@/components/icons";
import { Button } from "@/components/ui/button";

interface TTSControllerProps {
  textToSpeak: string;
  onEnd?: () => void;
}

export function TTSController({ textToSpeak, onEnd }: TTSControllerProps) {
  const [isTtsAllowed, setIsTtsAllowed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("math-pace-tts-allowed") === "true";
    }
    return false;
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    // Cleanup on unmount (navigation)
    return () => {
      if (synthRef.current) {
        if (utteranceRef.current) {
          utteranceRef.current.onend = null;
        }
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = () => {
    if (!synthRef.current || !textToSpeak) return;

    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    
    // Bug fix: Always resume before cancelling to prevent the engine from getting stuck in a paused state
    synthRef.current.resume();
    synthRef.current.cancel(); // Stop any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (onEnd && utteranceRef.current === utterance) {
        onEnd();
      }
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);

    // Ensure engine is awake before speaking new utterance
    synthRef.current.resume();
    synthRef.current.speak(utterance);
  };

  const handleAllowAndPlay = () => {
    setIsTtsAllowed(true);
    localStorage.setItem("math-pace-tts-allowed", "true");
    speak();
  };

  const handleMute = () => {
    setIsTtsAllowed(false);
    localStorage.setItem("math-pace-tts-allowed", "false");
    if (synthRef.current) {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
      }
      // Bug fix: Always resume before cancelling to prevent the engine from getting stuck in a paused state
      synthRef.current.resume();
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const togglePauseResume = () => {
    if (!synthRef.current) return;
    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false); // manually update state due to flaky onresume events
    } else if (isPlaying) {
      synthRef.current.pause();
      setIsPaused(true); // manually update state due to flaky onpause events
    } else {
      speak();
    }
  };

  // When textToSpeak changes (e.g. user navigates to next moment),
  // auto-play if TTS is allowed globally.
  useEffect(() => {
    if (isTtsAllowed) {
      speak();
    } else {
      if (synthRef.current) {
        if (utteranceRef.current) {
          utteranceRef.current.onend = null;
        }
        synthRef.current.cancel();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textToSpeak, isTtsAllowed]);

  return (
    <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-full p-1 shadow-sm border border-stone-200 dark:border-stone-700">
      {!isTtsAllowed ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleAllowAndPlay}
          title="Enable auto-play TTS"
          className="h-8 w-8 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
        >
          <VolumeX size={16} />
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePauseResume}
            title={isPlaying && !isPaused ? "Pause" : "Play"}
            className="h-8 w-8 rounded-full text-stone-700 dark:text-stone-200"
          >
            {isPlaying && !isPaused ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMute}
            title="Mute & Disable auto-play"
            className="h-8 w-8 rounded-full text-stone-700 dark:text-stone-200"
          >
            <Volume2 size={16} />
          </Button>
        </>
      )}
    </div>
  );
}
