const STORAGE_KEY = "gocoach_api_key";

export async function saveApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

export async function loadApiKey() {
  return localStorage.getItem(STORAGE_KEY);
}

export async function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}
