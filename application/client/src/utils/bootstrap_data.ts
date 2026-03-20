export function consumeBootstrapData<T>(key: string): T | null {
  const data = window.__BOOTSTRAP_DATA__;
  if (data == null || !(key in data)) {
    return null;
  }

  const value = data[key] as T;
  delete data[key];
  return value;
}

export function peekBootstrapData<T>(key: string): T | null {
  const data = window.__BOOTSTRAP_DATA__;
  if (data == null || !(key in data)) {
    return null;
  }

  return data[key] as T;
}
