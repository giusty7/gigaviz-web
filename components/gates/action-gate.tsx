"use client";

import { cloneElement, isValidElement, type MouseEvent, type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import { useUpgradeModal } from "@/components/billing/upgrade-modal-provider";

type ActionGateProps = {
  allowed?: boolean;
  children: ReactElement;
  className?: string;
};

export function ActionGate({ allowed = true, children, className }: ActionGateProps) {
  const { open } = useUpgradeModal();

  if (allowed || !isValidElement(children)) {
    return children;
  }

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    open();
  };

  const element = children as ReactElement<any>;
  const existingClassName = (element.props as { className?: string })?.className;

  return cloneElement(
    element,
    {
      onClick: handleClick,
      "aria-disabled": true,
      title: copy.tooltips.upgrade,
      className: cn(existingClassName, "pointer-events-auto cursor-not-allowed opacity-70", className),
    } as any
  );
}
