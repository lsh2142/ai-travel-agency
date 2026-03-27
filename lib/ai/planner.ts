import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class TravelPlanner {
  async *streamResponse(messages: ChatMessage[]): AsyncGenerator<string> {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system:
        "You are a helpful AI travel agent. Help users plan trips, suggest destinations, create itineraries, find flights and hotels, and answer travel-related questions. Be concise and friendly.",
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}
