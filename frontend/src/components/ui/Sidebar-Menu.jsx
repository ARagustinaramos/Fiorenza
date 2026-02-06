import { cva } from "class-variance-authority";

export const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-2 rounded-md p-2 text-sm transition hover:bg-sidebar-accent",
  {
    variants: {
      size: {
        sm: "h-7 text-xs",
        default: "h-8",
        lg: "h-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);
