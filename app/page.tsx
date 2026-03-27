"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI travel agent. Where would you like to go? I can help with destinations, itineraries, flights, hotels, and more.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    // Add empty assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Sorry, I ran into an error: ${msg}`,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 font-sans">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
        <span className="text-2xl" aria-hidden="true">
          ✈️
        </span>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          AI Travel Agent
        </h1>
      </header>

      {/* Message list */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[75%] rounded-2xl rounded-br-sm bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm text-white dark:text-zinc-900"
                    : "max-w-[75%] rounded-2xl rounded-bl-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100"
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3">
                <span className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
                      style={{ animationDelay: `${dot * 150}ms` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input area */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl flex items-end gap-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Ask me about your next trip…"
            rows={1}
            className={[
              "flex-1 resize-none rounded-xl border px-4 py-3",
              "text-sm text-zinc-900 dark:text-zinc-100",
              "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
              "bg-zinc-50 dark:bg-zinc-800",
              "border-zinc-300 dark:border-zinc-700",
              "focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400",
            ].join(" ")}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={[
              "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              "bg-zinc-900 dark:bg-zinc-100",
              "text-white dark:text-zinc-900",
              "hover:bg-zinc-700 dark:hover:bg-zinc-300",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            Send
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-xs text-zinc-400 dark:text-zinc-500 text-center">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </footer>
    </div>
  );
}
