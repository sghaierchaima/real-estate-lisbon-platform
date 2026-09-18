import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getStoredUser,
  getToken,
} from "@/lib/session";

import {
  getSavedPropertiesCount,
} from "@/lib/saved-properties-api";

import {
  getUnreadChatCount,
} from "@/lib/chat-api";

import type {
  AuthUser,
} from "@/types/auth";

export function useAppMenu() {
  const [
    menuVisible,
    setMenuVisible,
  ] = useState(false);

  const [
    menuUser,
    setMenuUser,
  ] =
    useState<AuthUser | null>(
      null,
    );

  const [
    savedCount,
    setSavedCount,
  ] = useState(0);

  const [
    unreadMessages,
    setUnreadMessages,
  ] = useState(0);

  const loadMenuData =
    useCallback(
      async () => {
        try {
          const token =
            await getToken();

          const storedUser =
            await getStoredUser<AuthUser>();

          setMenuUser(
            storedUser,
          );

          if (
            !token ||
            !storedUser
          ) {
            setSavedCount(0);
            setUnreadMessages(0);

            return;
          }

          if (
            storedUser.role ===
            "BUYER"
          ) {
            try {
              const saved =
                await getSavedPropertiesCount(
                  token,
                );

              setSavedCount(
                saved.count ?? 0,
              );
            } catch {
              setSavedCount(0);
            }
          } else {
            setSavedCount(0);
          }

          try {
            const unread =
              await getUnreadChatCount(
                token,
              );

            setUnreadMessages(
              unread.count ?? 0,
            );
          } catch {
            setUnreadMessages(0);
          }
        } catch {
          setMenuUser(null);
          setSavedCount(0);
          setUnreadMessages(0);
        }
      },
      [],
    );

  useEffect(() => {
    void loadMenuData();
  }, [loadMenuData]);

  useEffect(() => {
    if (menuVisible) {
      void loadMenuData();
    }
  }, [
    menuVisible,
    loadMenuData,
  ]);

  function openMenu() {
    setMenuVisible(true);
  }

  function closeMenu() {
    setMenuVisible(false);
  }

  return {
    menuVisible,
    menuUser,
    savedCount,
    unreadMessages,

    openMenu,
    closeMenu,
    refreshMenu:
      loadMenuData,
  };
}