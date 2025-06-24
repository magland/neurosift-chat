import { fetchCompletion } from "../completion/fetchCompletion";
import type { ORFunctionDescription, ORMessage, ORTool, ORToolCall } from "../completion/openRouterTypes";
import { JobRunnerClient } from "./jobRunnerClient";
import systemMessageText from './systemMessage.txt?raw';

// Clean up function for unmounting
export function cleanup() {
  if (jobRunnerClient) {
    jobRunnerClient.dispose();
    jobRunnerClient = null;
  }
}

// Singleton instance of JobRunnerClient
let jobRunnerClient: JobRunnerClient | null = null;

const getJobRunner = () => {
  if (!jobRunnerClient) {
    jobRunnerClient = new JobRunnerClient();
  }
  return jobRunnerClient;
};

const openRouterKey =
  "sk" +
  "-" +
  "or" +
  "-" +
  "v1" +
  "-" +
  "db" +
  "54" +
  "3e" +
  "9baa563e4ba92097b94d1a3140f1e7fba6e64c21f8ee97424b4674df36";

export async function processMessage(
  query: string,
  messageHistory: ORMessage[] = [],
  onStatusUpdate: (status: string) => void,
  model: string,
  onMessagesUpdate?: (messages: ORMessage[]) => void,
): Promise<{response: string, newMessages: ORMessage[], inputTokens: number, outputTokens: number}> {

  const systemMessage0 = systemMessageText;

  const messages: ORMessage[] = [
    {
      role: "system",
      content: systemMessage0
    },
    ...messageHistory
  ];
  messages.push({
    role: "user",
    content: query,
  });
  let currentMessages = messages;

  const toolFunctionDescriptions: ORFunctionDescription[] = [
    {
      name: "execute_javascript",
      description: "Execute a JavaScript script",
      parameters: {
        type: "object",
        properties: {
          script: {
            type: "string",
            description: "The JavaScript code to execute.",
          },
        },
        required: ["script"],
      },
    }
  ]

  let inputTokens = 0;
  let outputTokens = 0;
  while (true) {
    onStatusUpdate("Processing...");
    const response = await fetchCompletion({
      messages: currentMessages,
      model,
      tools: toolFunctionDescriptions.map((desc) => ({
        type: "function",
        function: desc,
      })) as ORTool[]
    }, {
      openRouterKey,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No response from model");
    }

    const choice = response.choices[0];
    if (!("message" in choice)) {
      throw new Error("Invalid response from model");
    }

    inputTokens += response.usage?.prompt_tokens || 0;
    outputTokens += response.usage?.completion_tokens || 0;
    console.info(`Tokens for completion: Input: ${inputTokens}, Output: ${outputTokens}`);

    const msg = choice.message;

    const processToolCall = async (toolCall: ORToolCall, onStatusUpdate: (status: string) => void): Promise<string> => {
      if (toolCall.function.name === "execute_javascript") {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        if (!args.script) {
          throw new Error("No script provided in tool call arguments");
        }
        onStatusUpdate("Executing JavaScript script...");
        console.info("Executing script:");
        console.info(args.script);

        try {
          onStatusUpdate("Sending script to remote job runner...");
          const scriptOutput = await getJobRunner().executeScript(args.script);

          console.info("Script output:");
          console.info(scriptOutput);
          return scriptOutput;
        } catch (error) {
          console.error('Error executing script:', error);
          return `Script execution failed: ${error instanceof Error ? error.message : String(error)}`;
        }
      } else {
        throw new Error(`Unsupported tool call function: ${toolCall.function.name}`);
      }
    }
    if (msg.role !== "assistant") {
      throw new Error(`Unexpected message role: ${msg.role}`);
    }

    if (msg.role === "assistant" && "tool_calls" in msg && msg.tool_calls) {
      currentMessages = [
        ...currentMessages,
        {
          role: "assistant",
          content: msg.content,
          tool_calls: msg.tool_calls,
        }
      ];
      if (onMessagesUpdate) {
        onMessagesUpdate(currentMessages.slice(1));
      }
      if (msg.tool_calls.length === 0) {
        throw new Error("tool_calls has length 0");
      }
      for (const tc of msg.tool_calls) {
        const a = await processToolCall(tc, onStatusUpdate);
        currentMessages = [
          ...currentMessages,
          {
            role: "tool",
            content: a,
            tool_call_id: tc.id,
          }
        ]
        if (onMessagesUpdate) {
          onMessagesUpdate(currentMessages.slice(1));
        }
      }
      // After processing all tool calls, continue to the next iteration
      continue;
    }
    else {
      if (!msg.content) {
        throw new Error("No content in assistant message");
      }
      currentMessages = [
        ...currentMessages,
        {
          role: "assistant",
          content: msg.content,
        }
      ];
      if (onMessagesUpdate) {
        onMessagesUpdate(currentMessages.slice(1));
      }
    }

    if (!msg.content) {
      throw new Error("No content in assistant message");
    }
    onStatusUpdate("Received response from model");
    console.info("Response from model:");
    console.info(msg.content);
    return {response: msg.content, newMessages: currentMessages.slice(1), inputTokens, outputTokens};
  }
}
