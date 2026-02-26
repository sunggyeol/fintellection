"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToolCallIndicator } from "./ToolCallIndicator";
import { isTextUIPart, isToolUIPart, getToolName } from "ai";
import type { UIMessage } from "ai";

interface MessageBubbleProps {
  message: UIMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={isUser ? "flex justify-end" : ""}>
      <div
        className={
          isUser
            ? "max-w-[80%] bg-primary px-4 py-2.5 text-sm text-primary-foreground"
            : "max-w-full text-sm text-foreground"
        }
      >
        {message.parts.map((part, i) => {
          if (isTextUIPart(part)) {
            return (
              <div key={i} className="prose-financial">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ children, href, ...props }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }

          if (isToolUIPart(part)) {
            const toolName = getToolName(part);
            const input = ("input" in part ? part.input : {}) as Record<string, unknown>;
            return (
              <ToolCallIndicator
                key={i}
                toolName={toolName}
                state={part.state}
                args={input}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
