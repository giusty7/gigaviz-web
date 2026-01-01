import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type Variant = "primary" | "ghost";

type ButtonBaseProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gigaviz-bg";

  const variantClass = (variant?: Variant) =>
    variant === "ghost"
      ? "border border-slate-700 text-slate-100 hover:bg-slate-900/60 active:bg-slate-900"
      : "bg-cyan-400 text-slate-900 hover:bg-cyan-300 active:bg-cyan-200";

  if ("href" in props && typeof props.href === "string") {
    const { variant = "primary", className = "", children, href, ...rest } = props;
    const classes = `${base} ${variantClass(variant)} ${className}`;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant = "primary", className = "", children, ...rest } = props;
  const classes = `${base} ${variantClass(variant)} ${className}`;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
