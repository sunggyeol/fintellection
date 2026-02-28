"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { UIMessage } from "ai";

interface MessageListProps {
  messages: UIMessage[];
  isStreaming?: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const rafRef = useRef<number>(0);

  // Track whether user has scrolled away from bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      stickToBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll: instant during streaming, smooth otherwise
  useEffect(() => {
    if (!stickToBottomRef.current) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;

      if (isStreaming) {
        // Instant scroll during streaming — no animation fighting
        container.scrollTop = container.scrollHeight;
      } else {
        // Smooth scroll for completed messages
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  });

  // Always stick to bottom when a new user message is sent
  const msgCount = messages.length;
  useEffect(() => {
    stickToBottomRef.current = true;
  }, [msgCount]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:py-6"
    >
      <div className="mx-auto flex max-w-3xl min-w-0 flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
}
