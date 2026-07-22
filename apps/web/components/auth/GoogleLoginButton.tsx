"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";

import { googleLogin } from "@/lib/auth-api";
import { saveSession } from "@/lib/session";
import { useToast } from "@/components/ui/ToastProvider";

export default function GoogleLoginButton() {
  const router = useRouter();
  const toast = useToast();

  async function handleSuccess(
    credential?: string,
  ) {
    if (!credential) {
      toast.error(
        "Google authentication failed",
        "Google did not return a valid credential. Please try again.",
      );

      return;
    }

    try {
      const result =
        await googleLogin(credential);

      saveSession(
        result.accessToken,
        result.user,
      );

      toast.success(
        "Login successful",
        "You have successfully signed in with Google.",
      );

      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Google authentication failed";

      toast.error(
        "Google authentication failed",
        message,
      );
    }
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(
          credentialResponse,
        ) => {
          void handleSuccess(
            credentialResponse.credential,
          );
        }}
        onError={() => {
          toast.error(
            "Google authentication failed",
            "Unable to connect to Google. Please try again.",
          );
        }}
      />
    </div>
  );
}