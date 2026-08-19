import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "real_estate_access_token";
const USER_KEY = "real_estate_user";

export async function saveToken(
  token: string,
) {
  await SecureStore.setItemAsync(
    TOKEN_KEY,
    token,
  );
}

export async function getToken() {
  return SecureStore.getItemAsync(
    TOKEN_KEY,
  );
}

export async function saveUser(
  user: unknown,
) {
  await SecureStore.setItemAsync(
    USER_KEY,
    JSON.stringify(user),
  );
}

export async function getStoredUser<T>(): Promise<T | null> {
  const value =
    await SecureStore.getItemAsync(
      USER_KEY,
    );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(
      TOKEN_KEY,
    ),

    SecureStore.deleteItemAsync(
      USER_KEY,
    ),
  ]);
}