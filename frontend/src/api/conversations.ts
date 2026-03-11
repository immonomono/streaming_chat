import client from './client';
import type { Conversation, Message } from '../types';

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await client.get<Conversation[]>('/conversations');
  return data;
}

export async function createConversation(title: string, model: string): Promise<Conversation> {
  const { data } = await client.post<Conversation>('/conversations', { title, model });
  return data;
}

export async function updateConversation(id: string, title: string): Promise<Conversation> {
  const { data } = await client.patch<Conversation>(`/conversations/${id}`, { title });
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  await client.delete(`/conversations/${id}`);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await client.get<Message[]>(`/conversations/${conversationId}/messages`);
  return data;
}
