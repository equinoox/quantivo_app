import * as SecureStore from "expo-secure-store";

export async function setSecureItem(key: string, value: string): Promise<void> { await SecureStore.setItemAsync(key, value); }
export async function getSecureItem(key: string): Promise<string | null> { return SecureStore.getItemAsync(key); }
export async function deleteSecureItem(key: string): Promise<void> { await SecureStore.deleteItemAsync(key); }

export async function setSecureJson<T>(key: string, value: T): Promise<void> {
  await setSecureItem(key, JSON.stringify(value));
}

export async function getSecureJson<T>(key: string): Promise<T | null> {
  let value: string | null = null;

  try {
    value = await getSecureItem(key);
  } catch {
    return null;
  }

  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    try {
      await deleteSecureItem(key);
    } catch {
      // Hydration should recover even if cleanup fails.
    }
    return null;
  }
}
