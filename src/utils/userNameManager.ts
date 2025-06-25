const USER_NAME_STORAGE_KEY = 'neurosift-chat-user-name';

export const getUserName = (): string | null => {
  return localStorage.getItem(USER_NAME_STORAGE_KEY);
};

export const setUserName = (name: string): void => {
  if (name.trim()) {
    localStorage.setItem(USER_NAME_STORAGE_KEY, name.trim());
  } else {
    localStorage.removeItem(USER_NAME_STORAGE_KEY);
  }
};
