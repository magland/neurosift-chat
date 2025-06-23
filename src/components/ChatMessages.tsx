import { useEffect, useRef, type FormEvent } from "react";
import MarkdownContent from "./MarkdownContent";
import type { ORMessage } from "../completion/openRouterTypes";
import {
  ThumbDown,
  ThumbDownOutlined,
  ThumbUp,
  ThumbUpOutlined,
} from "@mui/icons-material";

interface ChatMessagesProps {
  messages: ORMessage[];
  messageMetadata: {
    model: string;
    timestamp: number;
    feedback?: 'up' | 'down' | null
  }[];
  isLoading: boolean;
  followUpQuery: string;
  onFollowUpChange?: (value: string) => void;
  onFollowUpSubmit?: (e: FormEvent) => void;
  status: string;
  messageFeedback?: {[messageIndex: number]: 'up' | 'down' | null};
  onMessageFeedbackSubmit?: (messageIndex: number, feedback: "up" | "down" | null) => void;
}

export function ChatMessages({
  messages,
  messageMetadata,
  isLoading,
  followUpQuery,
  onFollowUpChange,
  onFollowUpSubmit,
  status,
  onMessageFeedbackSubmit,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Helper function to check if a message should have feedback
  const shouldShowFeedback = (message: ORMessage) => {
    return message.role === 'assistant' && !('tool_calls' in message && message.tool_calls);
  };

  if (messages.length === 0) return null;

  return (
    <div className="chat-container">
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.role}`}>
          <MarkdownContent
            content={(message.content || "no content") as string}
          />
          {shouldShowFeedback(message) && onMessageFeedbackSubmit && (
            <div
              className="message-feedback"
              style={{
                display: "flex",
                gap: "5px",
                justifyContent: "flex-end",
                marginTop: "8px",
                opacity: 0.7,
              }}
            >
              <button
                onClick={() => {
                  const currentFeedback = messageMetadata?.[index]?.feedback;
                  if (currentFeedback === "up") {
                    onMessageFeedbackSubmit(index, null);
                  } else {
                    onMessageFeedbackSubmit(index, "up");
                  }
                }}
                style={{
                  padding: "4px",
                  cursor: "pointer",
                  opacity: messageMetadata?.[index]?.feedback === "up" ? 1 : 0.5,
                  color: "#007bff",
                  background: "none",
                  border: "none",
                  fontSize: "14px",
                }}
                title="Helpful"
              >
                {messageMetadata?.[index]?.feedback === "up" ? <ThumbUp fontSize="small" /> : <ThumbUpOutlined fontSize="small" />}
              </button>
              <button
                onClick={() => {
                  const currentFeedback = messageMetadata?.[index]?.feedback;
                  if (currentFeedback === "down") {
                    onMessageFeedbackSubmit(index, null);
                  } else {
                    onMessageFeedbackSubmit(index, "down");
                  }
                }}
                style={{
                  padding: "4px",
                  cursor: "pointer",
                  opacity: messageMetadata?.[index]?.feedback === "down" ? 1 : 0.5,
                  color: "#007bff",
                  background: "none",
                  border: "none",
                  fontSize: "14px",
                }}
                title="Not helpful"
              >
                {messageMetadata?.[index]?.feedback === "down" ? <ThumbDown fontSize="small" /> : <ThumbDownOutlined fontSize="small" />}
              </button>
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="loading">{status || "Processing your query..."}</div>
      )}
      {!isLoading && onFollowUpChange && onFollowUpSubmit && (
        <form onSubmit={onFollowUpSubmit} className="follow-up-form">
          <input
            type="text"
            value={followUpQuery}
            onChange={(e) => onFollowUpChange(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="search-input"
          />
          <button type="submit" className="search-button">
            Send
          </button>
        </form>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
