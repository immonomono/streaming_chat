import client from './client';
import type { TokenResponse } from '../types';

export async function register(email: string, password: string): Promise<TokenResponse> {
  const { data } = await client.post<TokenResponse>('/auth/register', { email, password });
  return data;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const { data } = await client.post<TokenResponse>('/auth/login', { email, password });
  return data;
}
