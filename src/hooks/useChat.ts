import { useEffect, useRef, useState } from "react";
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

const defaultModel = "openai/gpt-4.1-mini";

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
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(["DANDI"]);
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

  const initialized = useRef(false);

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
          setSelectedRepositories(chatData.selectedRepositories || ["DANDI"]);
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

  // Save chat when messages update
  useEffect(() => {
    const saveCurrentChat = async () => {
      if (messages.length > 0 && chatId && chatKey) {
        try {
          await saveChat({
            messages,
            chatId,
            chatKey,
            promptTokens: tokenUsage.inputTokens,
            completionTokens: tokenUsage.outputTokens,
            estimatedCost: tokenUsage.cost,
            messageMetadata,
            selectedRepositories
          });
        } catch (error) {
          console.error('Failed to save chat:', error);
        }
      }
    };

    saveCurrentChat();
  }, [messages, chatId, chatKey, tokenUsage, selectedModel, messageMetadata, selectedRepositories]);

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
      `Searching ${selectedRepositories.join(", ")} ${
        selectedRepositories.length > 1 ? "repositories" : "repository"
      }...`
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
    selectedRepositories,
    setSelectedRepositories,
    chatId,
    chatKey,
    onMessageFeedbackSubmit: chatId ? handleMessageFeedbackSubmit : undefined,
  };
}
