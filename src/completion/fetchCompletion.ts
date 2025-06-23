/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ORNonStreamingChoice,
  ORRequest,
  ORResponse,
} from "./openRouterTypes";

export const fetchCompletion = async (
  request: ORRequest,
  o: {
    openRouterKey?: string;
    signal?: AbortSignal;
  }
): Promise<ORResponse & { cacheHit?: boolean }> => {
  const cacheKey = await computeHash(JSONStringifyDeterministic(request));
  const cachedResponse = await completionCacheGet(cacheKey);
  if (cachedResponse) {
    return {
      ...cachedResponse,
      cacheHit: true,
    };
  }

  let response;
  if (o.openRouterKey) {
    // directly hit the OpenRouter API
    const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${o.openRouterKey}`,
      },
      body: JSON.stringify(request),
      signal: o.signal,
    });
  } else {
    response = await fetch(
      "https://dandiset-explorer-api.vercel.app/api/completion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(o.openRouterKey ? { "x-openrouter-key": o.openRouterKey } : {}), // leave this as is in case we want to always route through the api
        },
        body: JSON.stringify(request),
        signal: o.signal,
      }
    );
  }

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const result = (await response.json()) as ORResponse;

  // important to do these checks prior to caching
  if (!result.choices) {
    console.warn(result);
    throw new Error("No choices in response");
  }
  if (result.choices.length === 0) {
    console.warn(result);
    throw new Error("No choices in response (length 0)");
  }

  // don't cache empty responses
  const choice = result.choices[0] as ORNonStreamingChoice;
  if (!choice.message.content && !choice.message.tool_calls) {
    console.warn(choice);
    console.warn("Got empty response");
  } else {
    // Cache the response if not empty
    await completionCacheSet(cacheKey, result);
  }

  return result;
};

// Initialize IndexedDB
const initDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("CompletionCache", 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("responses")) {
        const store = db.createObjectStore("responses", { keyPath: "key" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
};

// Get cached response
const completionCacheGet = async (key: string): Promise<ORResponse | null> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction("responses", "readonly");
    const store = transaction.objectStore("responses");
    const request = store.get(key);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.value);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error("Error reading from cache:", request.error);
      resolve(null);
    };
  });
};

// Store response in cache
const completionCacheSet = async (
  key: string,
  value: ORResponse
): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction("responses", "readwrite");
  const store = transaction.objectStore("responses");

  // Add new entry
  await new Promise<void>((resolve, reject) => {
    const request = store.put({
      key,
      value,
      timestamp: Date.now(),
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // Check and clean up if needed
  const countRequest = store.count();
  countRequest.onsuccess = () => {
    if (countRequest.result > 300) {
      // Get all entries sorted by timestamp
      const index = store.index("timestamp");
      const cursorRequest = index.openCursor();
      let deleteCount = countRequest.result - 300;

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && deleteCount > 0) {
          store.delete(cursor.value.key);
          deleteCount--;
          cursor.continue();
        }
      };
    }
  };
};

// Compute hash for cache key
const computeHash = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

function JSONStringifyDeterministic(value: any): string {
  if (value && typeof value === "object") {
    if (Array.isArray(value)) {
      // Arrays keep their natural order
      return "[" + value.map(JSONStringifyDeterministic).join(",") + "]";
    }
    // Objects → keys sorted lexicographically
    const keys = Object.keys(value).sort();
    return (
      "{" +
      keys
        .map(
          (k) => JSON.stringify(k) + ":" + JSONStringifyDeterministic(value[k])
        )
        .join(",") +
      "}"
    );
  }
  // Primitives & null
  return JSON.stringify(value);
}
