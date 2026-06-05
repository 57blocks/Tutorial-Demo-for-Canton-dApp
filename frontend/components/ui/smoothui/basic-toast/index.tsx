"use client";

import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  className?: string;
  duration?: number;
  isVisible?: boolean;
  message: string;
  onClose?: () => void;
  type?: ToastType;
}

const toastIcons = {
  success: <CheckCircle className="h-5 w-5" style={{ color: 'var(--color-success)' }} />,
  error: <XCircle className="h-5 w-5" style={{ color: 'var(--color-destructive)' }} />,
  warning: <AlertCircle className="h-5 w-5" style={{ color: 'var(--color-warning)' }} />,
  info: <Info className="h-5 w-5" style={{ color: '#60A5FA' }} />,
};

const toastClasses = {
  success:
    "border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.10)] text-[#BBF7D0]",
  error:
    "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.10)] text-[#FECACA]",
  warning:
    "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.10)] text-[#FDE68A]",
  info:
    "border-[rgba(96,165,250,0.25)] bg-[rgba(96,165,250,0.10)] text-[#BFDBFE]",
};

export default function BasicToast({
  message,
  type = "info",
  duration = 3000,
  onClose,
  isVisible = true,
  className = "",
}: ToastProps) {
  const [visible, setVisible] = useState(isVisible);
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!mounted) {
    return null;
  }

  const toastContent = (
    <AnimatePresence>
      {visible && (
        <motion.div
          animate={
            shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }
          }
          className={`fixed top-4 right-4 z-50 flex w-80 items-center gap-3 rounded-lg border p-4 shadow-lg ${toastClasses[type]} ${className}`}
          exit={
            shouldReduceMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : {
                  opacity: 0,
                  x: 50,
                  scale: 0.8,
                  transition: { duration: 0.15 },
                }
          }
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0, x: 50, scale: 0.8 }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring" as const, bounce: 0.1, duration: 0.25 }
          }
        >
          <div className="flex-shrink-0">{toastIcons[type]}</div>
          <p className="flex-1 text-sm">{message}</p>
          <button
            className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-white/5"
            onClick={() => {
              setVisible(false);
              onClose?.();
            }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(toastContent, document.body);
}

// Example of how to use this component:
export function ToastDemo() {
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<ToastType>("success");

  const handleShowToast = (type: ToastType) => {
    setToastType(type);
    setShowToast(true);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm text-white hover:bg-emerald-600"
          onClick={() => handleShowToast("success")}
          type="button"
        >
          Success Toast
        </button>
        <button
          className="rounded-md bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
          onClick={() => handleShowToast("error")}
          type="button"
        >
          Error Toast
        </button>
        <button
          className="rounded-md bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600"
          onClick={() => handleShowToast("warning")}
          type="button"
        >
          Warning Toast
        </button>
        <button
          className="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
          onClick={() => handleShowToast("info")}
          type="button"
        >
          Info Toast
        </button>
      </div>

      <AnimatePresence>
        {showToast && (
          <BasicToast
            duration={3000}
            message={`This is a ${toastType} message example!`}
            onClose={() => setShowToast(false)}
            type={toastType}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
