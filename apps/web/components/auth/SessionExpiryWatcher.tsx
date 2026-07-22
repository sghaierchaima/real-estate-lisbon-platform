"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  clearSession,
  getToken,
} from "@/lib/session";

type JwtPayload = {
  exp?: number;
};

function getTokenExpiration(
  token: string,
): number | null {
  try {
    const tokenParts = token.split(".");

    if (tokenParts.length !== 3) {
      return null;
    }

    const payloadPart = tokenParts[1];

    if (!payloadPart) {
      return null;
    }

    const normalizedPayload = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedPayload =
      normalizedPayload.padEnd(
        normalizedPayload.length +
          ((4 -
            (normalizedPayload.length %
              4)) %
            4),
        "=",
      );

    const payload = JSON.parse(
      window.atob(paddedPayload),
    ) as JwtPayload;

    if (!payload.exp) {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export default function SessionExpiryWatcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      return;
    }

    const expiresAt =
      getTokenExpiration(token);

    if (!expiresAt) {
      clearSession();

      router.replace(
        "/login?reason=session-expired",
      );

      return;
    }

    const remainingTime =
      expiresAt - Date.now();

    if (remainingTime <= 0) {
      clearSession();

      router.replace(
        "/login?reason=session-expired",
      );

      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        clearSession();

        router.replace(
          "/login?reason=session-expired",
        );
      }, remainingTime);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, router]);

  return null;
}