"use client";

import { cn } from "./utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./Sheet";
import { useSidebar } from "./Sidebar-Context";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div className={cn("bg-sidebar w-(--sidebar-width)", className)}>
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side={side}
          className="bg-sidebar p-0"
          style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Mobile sidebar</SheetDescription>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      data-state={state}
      data-side={side}
      className={cn("hidden md:block", className)}
      {...props}
    >
      <div className="fixed inset-y-0 w-(--sidebar-width)">
        {children}
      </div>
    </div>
  );
}
