import { useCallback, useState } from 'react'

export interface ChatData {
  chatId: string
  userName?: string
  messages: { role: string; content: string }[]
  messageMetadata: {
    model: string
    timestamp: number
    feedback: 'up' | 'down' | null
  }[]
  timestampCreated: number
  timestampUpdated: number
  estimatedCost: number
}

const chatPasscode = "default-chat-passcode";

export const useChats = () => {
  const [chats, setChats] = useState<ChatData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadChats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('--- fetching chats ---')
      const response = await fetch(`https://neurosift-chat-api.vercel.app/api/list_chats?passcode=${chatPasscode}`)
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid passcode')
        }
        throw new Error('Failed to load chats')
      }
      const data = await response.json()
      setChats(data.chats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats')
      setChats([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const countFeedback = (metadata: ChatData['messageMetadata'], type: 'up' | 'down') => {
    try {
      return metadata.filter(m => m.feedback === type).length
    }
    catch (err) {
      console.warn('Failed to count feedback:', err);
      return 0;
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getFirstUserMessage = (messages: ChatData['messages']) => {
    return messages.find(m => m.role === 'user')?.content || ''
  }

  const getModelsUsed = (metadata: ChatData['messageMetadata']) => {
    try {
      const uniqueModels = new Set(metadata.map(m => m.model).map(m => m.split("/").pop() || m));
      return Array.from(uniqueModels).join(', ')
    }
    catch (err) {
      console.warn('Failed to get models used:', err);
      return '';
    }
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`
  }

  const getMessageCount = (messages: ChatData['messages']) => {
    return messages.length
  }

  return {
    chats,
    isLoading,
    error,
    loadChats,
    countFeedback,
    formatDate,
    getFirstUserMessage,
    getModelsUsed,
    formatCost,
    getMessageCount
  }
}
