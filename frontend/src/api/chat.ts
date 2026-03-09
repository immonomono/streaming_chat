export async function streamChat(
  conversationId: number,
  message: string,
  onChunk: (content: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
  onTitle?: (title: string) => void,
) {
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch('/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversation_id: conversationId, message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop() || '';

      for (const line of parts) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) onChunk(parsed.content);
          if (parsed.title && onTitle) onTitle(parsed.title);
        } catch {
          // skip malformed JSON
        }
      }
    }
    onDone();
  } catch (error) {
    onError(error as Error);
  }
}
