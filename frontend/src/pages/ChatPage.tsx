import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatArea from '../components/ChatArea';
import type { Conversation, Message } from '../types';
import { listConversations, createConversation, deleteConversation, getMessages } from '../api/conversations';
import { streamChat } from '../api/chat';

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState('gpt-4o-mini');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadConversations = useCallback(async () => {
    const convs = await listConversations();
    setConversations(convs);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSelect = async (id: number) => {
    setActiveId(id);
    setSidebarOpen(false);
    const msgs = await getMessages(id);
    setMessages(msgs);
    const conv = conversations.find((c) => c.id === id);
    if (conv) setModel(conv.model);
  };

  const handleNew = () => {
    setActiveId(null);
    setMessages([]);
    setModel('gpt-4o-mini');
    setSidebarOpen(false);
  };

  const handleDelete = async (id: number) => {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const handleSend = async (content: string) => {
    if (!activeId) {
      // Auto-create conversation if none selected
      const conv = await createConversation('New Conversation', model);
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      sendMessage(conv.id, content);
    } else {
      sendMessage(activeId, content);
    }
  };

  const sendMessage = (convId: number, content: string) => {
    const userMsg: Message = { role: 'user', content };
    const assistantMsg: Message = { role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    streamChat(
      convId,
      content,
      (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      },
      () => {
        setIsStreaming(false);
      },
      (error) => {
        console.error('Stream error:', error);
        setIsStreaming(false);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant' && last.content === '') {
            updated[updated.length - 1] = { ...last, content: 'An error occurred. Please try again.' };
          }
          return updated;
        });
      },
      (title) => {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title } : c))
        );
      }
    );
  };

  return (
    <Layout
      sidebar={
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={handleNew}
          onDelete={handleDelete}
          onClose={() => setSidebarOpen(false)}
        />
      }
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
    >
      <Header
        model={model}
        onModelChange={setModel}
        hasConversation={activeId !== null}
        onToggleSidebar={() => setSidebarOpen(true)}
      />
      <ChatArea messages={messages} onSend={handleSend} isStreaming={isStreaming} />
    </Layout>
  );
}
