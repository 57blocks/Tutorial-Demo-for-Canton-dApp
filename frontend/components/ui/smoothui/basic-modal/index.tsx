"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOnClickOutside } from "usehooks-ts";

export interface BasicModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  title?: string;
}

const modalSizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

export default function BasicModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: BasicModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  useOnClickOutside(modalRef, () => onClose());
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const titleId = title
    ? `modal-title-${Math.random().toString(36).substring(2, 9)}`
    : undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus management: Save previous focus and restore on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      // Focus the close button or first focusable element when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else if (previousActiveElementRef.current) {
      // Restore focus when modal closes
      previousActiveElementRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape key press and focus trap
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap: keep focus within modal
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements.at(-1);

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else if (document.activeElement === lastElement) {
          // Tab
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Note: Body scroll locking is handled by the overlay and modal positioning
  // No need to manually set body overflow as it can conflict with other components

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[80]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0 }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            onClick={(e) => {
              if (e.target === overlayRef.current) {
                onClose();
              }
            }}
            ref={overlayRef}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          />

          {/* Modal */}
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto px-4 py-6 sm:p-0"
            exit={{ opacity: 0 }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          >
            <motion.div
              animate={shouldReduceMotion ? {} : { scale: 1, y: 0, opacity: 1 }}
              aria-labelledby={titleId}
              aria-modal="true"
              className={`${modalSizes[size]} relative mx-auto w-full rounded-2xl border p-4 sm:p-6`}
              style={{
                borderColor: 'rgba(255,255,255,0.10)',
                background: 'var(--color-surface-raised)',
                boxShadow: 'var(--shadow-palette)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : {
                      scale: 0.95,
                      y: 10,
                      opacity: 0,
                      transition: { duration: 0.15 },
                    }
              }
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { scale: 0.95, y: 10, opacity: 0 }
              }
              ref={modalRef}
              role="dialog"
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring" as const,
                      damping: 20,
                      stiffness: 300,
                      mass: 0.8,
                      duration: 0.3,
                    }
              }
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                {title && (
                  <h3
                    className="font-semibold text-lg leading-6 tracking-tight"
                    id={titleId}
                    style={{ fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif" }}
                  >
                    {title}
                  </h3>
                )}
                <motion.button
                  aria-label="Close modal"
                  className="ml-auto min-h-[44px] min-w-[44px] rounded-xl p-2 transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                  onClick={onClose}
                  ref={closeButtonRef}
                  style={{ color: 'var(--color-muted-foreground)' }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  type="button"
                  whileHover={shouldReduceMotion ? {} : { rotate: 90 }}
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="relative">{children}</div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(modalContent, document.body);
}
