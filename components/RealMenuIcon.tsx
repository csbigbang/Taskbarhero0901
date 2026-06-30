"use client";

type RealMenuIconProps = {
  src: string;
  alt: string;
  className?: string;
};

export function RealMenuIcon({ src, alt, className = "real-menu-icon" }: RealMenuIconProps) {
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      onError={(event) => {
        event.currentTarget.remove();
      }}
    />
  );
}
