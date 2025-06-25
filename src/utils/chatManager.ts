import { v4 as uuidv4 } from 'uuid';
import type { ORMessage } from '../completion/openRouterTypes';

const CHAT_KEYS_STORAGE_KEY = 'neurosift-chat-keys';
const chatPasscode = "default-chat-passcode";

interface ChatKeyMapping {
  pairs: {
    [chatId: string]: string; // chatId -> chatKey
  }
}

export const generateChatKey = () => {
  return uuidv4();
};

export const computeChatId = async (chatKey: string) => {
  return await sha1(chatKey);
};

const sha1 = async (s: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(s);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => ("0" + b.toString(16)).slice(-2))
    .join("");
  return hashHex;
};

export const saveChatKeyMapping = (chatId: string, chatKey: string) => {
  const existingData = localStorage.getItem(CHAT_KEYS_STORAGE_KEY);
  const mapping: ChatKeyMapping = existingData
    ? JSON.parse(existingData)
    : { pairs: {} };

  mapping.pairs[chatId] = chatKey;
  localStorage.setItem(CHAT_KEYS_STORAGE_KEY, JSON.stringify(mapping));
};

export const getChatKey = (chatId: string): string | null => {
  const existingData = localStorage.getItem(CHAT_KEYS_STORAGE_KEY);
  if (!existingData) return null;

  const mapping: ChatKeyMapping = JSON.parse(existingData);
  return mapping.pairs[chatId] || null;
};

interface SaveChatOptions {
  messages: ORMessage[];
  chatId: string;
  chatKey: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
  messageMetadata: {
    model: string;
    timestamp: number;
    feedback?: 'up' | 'down' | null;
  }[];
  userName?: string;
}

export const saveChat = async (options: SaveChatOptions) => {
  const response = await fetch('https://neurosift-chat-api.vercel.app/api/save_chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat: {
        chatId: options.chatId,
        userName: options.userName,
        promptTokens: options.promptTokens,
        completionTokens: options.completionTokens,
        estimatedCost: options.estimatedCost,
        messageMetadata: options.messageMetadata,
        messages: options.messages,
        timestampCreated: Date.now(),
        timestampUpdated: Date.now(),
      },
      chatKey: options.chatKey,
      size: new Blob([JSON.stringify(options.messages)]).size,
      passcode: chatPasscode
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save chat');
  }

  return response.json();
};

export const loadChat = async (chatId: string) => {
  const url = new URL('https://neurosift-chat-api.vercel.app/api/load_chat');
  url.searchParams.set('chatId', chatId);
  url.searchParams.set('passcode', chatPasscode);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to load chat');
  }

  const data = await response.json();
  return {
    ...data
  };
};
