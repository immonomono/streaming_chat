import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatArea from '../components/ChatArea';
import type { Conversation, Message } from '../types';
import { listConversations, createConversation, deleteConversation, getMessages } from '../api/conversations';
import { streamChat } from '../api/chat';

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const match = location.pathname.match(/^\/c\/(.+)$/);
  const activeId = match ? match[1] : null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState('gpt-4o-mini');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const skipNextLoadRef = useRef(false);

  const loadConversations = useCallback(async () => {
    const convs = await listConversations();
    setConversations(convs);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation changes via URL
  useEffect(() => {
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return;
    }
    if (activeId) {
      getMessages(activeId).then((msgs) => setMessages(msgs));
    } else {
      setMessages([]);
    }
  }, [activeId]);

  // Sync model when active conversation changes
  useEffect(() => {
    if (activeId) {
      const conv = conversations.find((c) => c.id === activeId);
      if (conv) setModel(conv.model);
    }
  }, [activeId, conversations]);

  const handleSelect = (id: string) => {
    setSidebarOpen(false);
    navigate(`/c/${id}`);
  };

  const handleNew = () => {
    setSidebarOpen(false);
    navigate('/');
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      navigate('/');
    }
  };

  const handleSend = async (content: string) => {
    if (!activeId) {
      const conv = await createConversation('New Conversation', model);
      setConversations((prev) => [conv, ...prev]);
      skipNextLoadRef.current = true;
      navigate(`/c/${conv.id}`, { replace: true });
      sendMessage(conv.id, content);
    } else {
      sendMessage(activeId, content);
    }
  };

  const sendMessage = (convId: string, content: string) => {
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
      },
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
