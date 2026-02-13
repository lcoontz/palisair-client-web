"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onDone: () => void;
}

export function Toast({ message, visible, onDone }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setExiting(false);
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(onDone, 500);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-lg min-w-[300px] ${
        exiting ? "toast-exit" : "toast-enter"
      }`}
    >
      <span className="text-2xl">&#x2705;</span>
      <div>
        <div className="text-sm font-bold text-emerald-600">Changes Saved</div>
        <div className="text-sm text-slate-500">{message}</div>
      </div>
    </div>
  );
}
