"use client";

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextType = {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

function toastStyle(type: ToastType) {
  if (type === "success") {
    return {
      icon: CheckCircle2,
      iconClass: "text-[#2E7D32]",
      bg: "bg-[#F0FDF4]",
      border: "border-[#BBF7D0]",
    };
  }

  if (type === "error") {
    return {
      icon: XCircle,
      iconClass: "text-[#DC2626]",
      bg: "bg-[#FEF2F2]",
      border: "border-[#FECACA]",
    };
  }

  if (type === "warning") {
    return {
      icon: AlertTriangle,
      iconClass: "text-[#D97706]",
      bg: "bg-[#FFFBEB]",
      border: "border-[#FDE68A]",
    };
  }

  return {
    icon: Info,
    iconClass: "text-[#1B365D]",
    bg: "bg-[#EFF6FF]",
    border: "border-[#BFDBFE]",
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function pushToast(type: ToastType, title: string, message?: string) {
    const id =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4200);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  const value = useMemo(
    () => ({
      success: (title: string, message?: string) =>
        pushToast("success", title, message),
      error: (title: string, message?: string) =>
        pushToast("error", title, message),
      warning: (title: string, message?: string) =>
        pushToast("warning", title, message),
      info: (title: string, message?: string) =>
        pushToast("info", title, message),
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed right-6 top-6 z-[9999] flex w-[380px] max-w-[calc(100vw-32px)] flex-col gap-3">
        {toasts.map((toast) => {
          const style = toastStyle(toast.type);
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={`rounded-[22px] border ${style.border} ${style.bg} bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,35,64,0.16)] backdrop-blur-md`}
            >
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Icon className={`h-5 w-5 ${style.iconClass}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-[#0F2340]">
                    {toast.title}
                  </p>

                  {toast.message && (
                    <p className="mt-1 text-[14px] leading-5 text-[#667085]">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="rounded-full p-1 text-[#667085] transition hover:bg-white hover:text-[#0F2340]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}