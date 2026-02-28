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
    <div className={isUser ? "flex justify-end" : "min-w-0"}>
      <div
        className={
          isUser
            ? "max-w-[85%] overflow-hidden break-words bg-primary px-4 py-2.5 text-sm text-primary-foreground"
            : "min-w-0 max-w-full overflow-hidden break-words text-sm text-foreground"
        }
      >
        {message.parts.map((part, i) => {
          if (isTextUIPart(part)) {
            if (!part.text.trim()) return null;

            if (isUser) {
              return (
                <p
                  key={i}
                  className="min-w-0 whitespace-pre-wrap break-words leading-tight"
                >
                  {part.text}
                </p>
              );
            }

            return (
              <div key={i} className="prose-financial min-w-0 break-words">
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
            const output = "output" in part ? part.output : undefined;
            return (
              <ToolCallIndicator
                key={i}
                toolName={toolName}
                state={part.state}
                args={input}
                output={output}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
