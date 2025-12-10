import * as React from "react";
import Link from "next/link";

type Variant = "primary" | "ghost";

interface ButtonBaseProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps & {
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    className = "",
    children,
    href,
    ...rest
  } = props as any;

  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gigaviz-bg";
  const variants: Record<Variant, string> = {
    primary: "bg-cyan-400 text-slate-900 hover:bg-cyan-300 active:bg-cyan-200",
    ghost:
      "border border-slate-700 text-slate-100 hover:bg-slate-900/60 active:bg-slate-900",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} {...(rest as any)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as any)}>
      {children}
    </button>
  );
}
