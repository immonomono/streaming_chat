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

export async function deleteConversation(id: number): Promise<void> {
  await client.delete(`/conversations/${id}`);
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  const { data } = await client.get<Message[]>(`/conversations/${conversationId}/messages`);
  return data;
}
