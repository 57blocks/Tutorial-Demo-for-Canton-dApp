"use client";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import type { ButtonHTMLAttributes } from "react";

const smoothButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-sm transition-all duration-150 ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-accent)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:bg-[var(--color-accent-soft)]",
        destructive:
          "bg-[var(--color-destructive)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:opacity-90",
        outline:
          "border border-[var(--color-border)] bg-transparent text-[var(--color-foreground-dim)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.16)] hover:text-[var(--color-foreground)]",
        secondary:
          "bg-[rgba(255,255,255,0.04)] text-[var(--color-foreground-dim)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--color-foreground)]",
        ghost:
          "text-[var(--color-muted-foreground)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--color-foreground)]",
        link: "text-[var(--color-accent)] underline-offset-4 hover:underline",
        candy:
          "border border-[rgba(255,255,255,0.10)] bg-gradient-to-b from-[var(--color-accent)] to-[var(--color-brand-secondary)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.22),inset_0_0.75px_0_rgba(255,255,255,0.20)] hover:from-[var(--color-accent-soft)] hover:to-[var(--color-accent)] [&_svg]:drop-shadow-[0_1px_1px_rgba(0,0,0,0.20)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 py-2",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type SmoothButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof smoothButtonVariants> & {
    asChild?: boolean;
    ref?: React.Ref<HTMLButtonElement>;
  };

function SmoothButton({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: SmoothButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(smoothButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
}

export default SmoothButton;
export { smoothButtonVariants };
