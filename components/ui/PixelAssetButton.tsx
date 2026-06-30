import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type BaseProps = {
  children: ReactNode;
  icon?: string;
  active?: boolean;
  variant?: "default" | "gold" | "red" | "green";
  className?: string;
};

type LinkProps = BaseProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "className"> & {
  href: string;
};

type ButtonProps = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
  href?: never;
};

function inner(icon: string | undefined, children: ReactNode) {
  return (
    <>
      {icon ? <img className="pixel-asset-btn-icon-img" src={icon} alt="" loading="lazy" decoding="async" /> : null}
      <span>{children}</span>
    </>
  );
}

export function PixelAssetButton(props: LinkProps | ButtonProps) {
  const { children, icon, active, variant = "default", className = "" } = props;
  const classes = ["pixel-asset-btn", `pixel-asset-btn-${variant}`, active ? "active" : "", className]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href) {
    const { href, children: _children, icon: _icon, active: _active, variant: _variant, className: _className, ...anchorProps } = props as LinkProps;
    return (
      <Link href={href} {...anchorProps} className={classes} data-active={active ? "true" : "false"}>
        {inner(icon, children)}
      </Link>
    );
  }

  const { children: _children, icon: _icon, active: _active, variant: _variant, className: _className, ...buttonProps } = props as ButtonProps;
  return (
    <button {...buttonProps} className={classes} data-active={active ? "true" : "false"}>
      {inner(icon, children)}
    </button>
  );
}
