import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  onSend: (message: string) => void;
  isStreaming: boolean;
}

export default function ChatArea({ messages, onSend, isStreaming }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);
  const latestUserMsgRef = useRef<HTMLDivElement>(null);
  const lastMsgRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);
  const [spacerHeight, setSpacerHeight] = useState(0);

  // Measure container height for bottom spacer
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(([entry]) => {
      setSpacerHeight(Math.max(0, entry.contentRect.height - 150));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Find latest user message index for ref assignment
  const latestUserMsgIndex = messages.reduce(
    (acc, msg, i) => (msg.role === 'user' ? i : acc),
    -1
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;

    const prevCount = prevMsgCountRef.current;
    const countChanged = messages.length !== prevCount;

    if (countChanged) {
      const addedCount = messages.length - prevCount;
      prevMsgCountRef.current = messages.length;

      if (addedCount === 2 && messages[messages.length - 2]?.role === 'user') {
        // User just sent a new message — smooth scroll it to top of viewport
        latestUserMsgRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      } else {
        // Conversation loaded or switched — show last message from its start
        if (lastMsgRef.current && container) {
          const msgHeight = lastMsgRef.current.offsetHeight;
          const containerHeight = container.clientHeight;
          if (msgHeight <= containerHeight) {
            // Last message fits in viewport — scroll so its bottom aligns with viewport bottom
            const msgTop = lastMsgRef.current.offsetTop;
            container.scrollTop = msgTop + msgHeight - containerHeight;
          } else {
            // Last message taller than viewport — show from the start
            lastMsgRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
          }
        } else {
          contentEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
      }
      return;
    }

    // During streaming — if content end goes below viewport, follow it
    if (isStreaming && contentEndRef.current) {
      const endRect = contentEndRef.current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (endRect.bottom > containerRect.bottom) {
        container.scrollTop += endRect.bottom - containerRect.bottom;
      }
    }
  }, [messages, isStreaming]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 pt-32">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg">Start a conversation</p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => {
            const isLastMsg = i === messages.length - 1;
            const isLatestUser = i === latestUserMsgIndex;
            return (
              <div
                key={i}
                ref={isLatestUser ? latestUserMsgRef : isLastMsg ? lastMsgRef : undefined}
                className="scroll-mt-4"
              >
                <MessageBubble message={msg} />
              </div>
            );
          })}
          {isStreaming &&
            messages[messages.length - 1]?.role === 'assistant' &&
            messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}
          <div ref={contentEndRef} />
          {/* Spacer allows last message to scroll to top of viewport */}
          <div style={{ height: spacerHeight }} aria-hidden="true" />
        </div>
      </div>
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  );
}
