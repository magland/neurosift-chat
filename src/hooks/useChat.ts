import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { processMessage } from "../utils/processMessage";
import { AVAILABLE_MODELS } from "../utils/availableModels";
import type { ORMessage } from "../completion/openRouterTypes";
import {
  generateChatKey,
  computeChatId,
  saveChatKeyMapping,
  getChatKey,
  saveChat,
  loadChat
} from "../utils/chatManager";
import { getUserName } from "../utils/userNameManager";
import { useUsage } from "../contexts/UsageContext";

// const defaultModel = "openai/gpt-4.1-mini";
const defaultModel = "anthropic/claude-sonnet-4";

export function useChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<ORMessage[]>([]);
  const [messageMetadata, setMessageMetadata] = useState<{
    model: string;
    timestamp: number;
    feedback?: 'up' | 'down' | null
  }[]>([]);
  const [mainQuery, setMainQuery] = useState("");
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [chatKey, setChatKey] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<{
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>({
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
  });
  const [isDirty, setIsDirty] = useState(false);

  const { refreshUsage } = useUsage();
  const initialized = useRef(false);
  const isSaving = useRef(false);

  // Initialize chat when component mounts
  useEffect(() => {
    if (initialized.current) return; // Prevent re-initialization
    initialized.current = true;
    const initializeChat = async () => {
      const urlChatId = searchParams.get('chat');

      if (urlChatId) {
        // Try to load existing chat
        const storedChatKey = getChatKey(urlChatId);
        if (storedChatKey) {
          setChatKey(storedChatKey);
          setChatId(urlChatId);
        }

        try {
          const chatData = await loadChat(urlChatId);
          setMessages(chatData.messages);
          setMessageMetadata(chatData.messageMetadata || chatData.messages.map(() => ({
            model: selectedModel,
            timestamp: Date.now(),
            feedback: null
          })));
          const modelOfChat = determineModelOfChat(chatData);
          if (modelOfChat) {
            setSelectedModel(modelOfChat);
          }
        } catch (error) {
          console.error('Failed to load chat:', error);
        }
      } else {
        setChatKey(null);
        setChatId(null);
      }
    };

    initializeChat();
  }, [selectedModel, searchParams]);

  const saveCurrentChat = useCallback(async () => {
    if (messages.length > 0 && chatId && chatKey && !isSaving.current) {
      isSaving.current = true;
      try {
        const userName = getUserName();
        await saveChat({
          messages,
          chatId,
          chatKey,
          promptTokens: tokenUsage.inputTokens,
          completionTokens: tokenUsage.outputTokens,
          estimatedCost: tokenUsage.cost,
          messageMetadata,
          userName: userName || undefined,
        });
        setIsDirty(false);
      } catch (error) {
        console.error('Failed to save chat:', error);
      } finally {
        isSaving.current = false;
      }
    }
  }, [messages, chatId, chatKey, tokenUsage, messageMetadata]);

  // Auto-save when chat becomes dirty
  useEffect(() => {
    if (isDirty && messages.length > 0 && chatId && chatKey) {
      saveCurrentChat();
    }
  }, [isDirty, saveCurrentChat, messages.length, chatId, chatKey]);

  useEffect(() => {
    console.info(
      `Total tokens used: Input ${tokenUsage.inputTokens}, Output ${tokenUsage.outputTokens}, Est. Cost ${tokenUsage.cost}`
    );
  }, [tokenUsage, selectedModel]);

  const handleMainSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!mainQuery.trim()) return;

    // Create new chat
    const newChatKey = generateChatKey();
    const newChatId = await computeChatId(newChatKey);

    setChatKey(newChatKey);
    setChatId(newChatId);
    saveChatKeyMapping(newChatId, newChatKey);
    setSearchParams({ chat: newChatId });

    setMessages([{ role: "user", content: mainQuery }]);
    setMessageMetadata([{
      model: selectedModel,
      timestamp: Date.now(),
      feedback: null
    }]);
    setIsLoading(true);
    setFollowUpQuery("");
    setStatus(
      `Processing query...`
    );

    try {
      const { newMessages, inputTokens, outputTokens } = await processMessage(
        mainQuery,
        [],
        setStatus,
        selectedModel,
        (newMessages) => {
          setMessages(newMessages);
          setMessageMetadata((prev) => [
            ...prev,
            ...newMessages.slice(prev.length).map(() => ({
              model: selectedModel,
              timestamp: Date.now(),
              feedback: null
            })),
          ]);
        }
      );
      const a = AVAILABLE_MODELS.find((m) => m.model === selectedModel);
      const cost =
        ((a?.cost.prompt || 0) * inputTokens) / 1_000_000 +
        ((a?.cost.completion || 0) * outputTokens) / 1_000_000;
      setTokenUsage((prev) => ({
        inputTokens: prev.inputTokens + inputTokens,
        outputTokens: prev.outputTokens + outputTokens,
        cost: prev.cost + cost,
      }));
      setMessages(newMessages);
      setMessageMetadata((prev) => [
        ...prev,
        ...newMessages.slice(prev.length).map(() => ({
          model: selectedModel,
          timestamp: Date.now(),
          feedback: null
        })),
      ]);
      setMainQuery("");

      // Mark chat as dirty to trigger auto-save
      setIsDirty(true);

      // Refresh usage data after successful completion
      refreshUsage();
    } finally {
      setStatus("");
      setIsLoading(false);
    }
  };

  const handleMessageFeedbackSubmit = (messageIndex: number, newFeedback: 'up' | 'down' | null) => {
    if (!chatId) return;
    setMessageMetadata((prev) => {
      const updated = [...prev];
      if (updated[messageIndex]) {
        updated[messageIndex].feedback = newFeedback;
      } else {
        // In case metadata is out of sync, ensure it exists
        updated[messageIndex] = {
          model: selectedModel,
          timestamp: Date.now(),
          feedback: newFeedback
        };
      }
      return updated;
    });
    // Mark chat as dirty to trigger auto-save
    setIsDirty(true);
  };

  const handleFollowUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!followUpQuery.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: followUpQuery }]);
    setIsLoading(true);
    setStatus("Processing follow-up query...");

    try {
      const { newMessages, inputTokens, outputTokens } = await processMessage(
        followUpQuery,
        messages,
        setStatus,
        selectedModel,
        (newMessages) => {
          setMessages(newMessages);
        }
      );
      const a = AVAILABLE_MODELS.find((m) => m.model === selectedModel);
      const cost =
        ((a?.cost.prompt || 0) * inputTokens) / 1_000_000 +
        ((a?.cost.completion || 0) * outputTokens) / 1_000_000;
      setTokenUsage((prev) => ({
        inputTokens: prev.inputTokens + inputTokens,
        outputTokens: prev.outputTokens + outputTokens,
        cost: prev.cost + cost,
      }));
      setMessages(newMessages);
      setFollowUpQuery("");

      // Mark chat as dirty to trigger auto-save
      setIsDirty(true);
    } finally {
      setStatus("");
      setIsLoading(false);
    }
  };

  return {
    messages,
    messageMetadata,
    mainQuery,
    followUpQuery,
    isLoading,
    setMainQuery,
    setFollowUpQuery,
    handleMainSearch,
    handleFollowUp,
    status,
    selectedModel,
    setSelectedModel,
    chatId,
    chatKey,
    onMessageFeedbackSubmit: chatId ? handleMessageFeedbackSubmit : undefined
  };
}

const determineModelOfChat = (chatData: { messages: ORMessage[]; messageMetadata?: { model: string }[] }) => {
  if (chatData.messageMetadata && chatData.messageMetadata.length > 0) {
    for (let i = chatData.messageMetadata.length - 1; i >= 0; i--) {
      const meta = chatData.messageMetadata[i];
      if (meta && meta.model) {
        return meta.model;
      }
    }
  }
  return undefined;
};