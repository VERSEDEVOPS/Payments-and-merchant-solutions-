import { useId } from "react";

export function VerseTokenMark({
  size = 64,
  title = "fxVERSE token",
  decorative = false,
}: {
  size?: number;
  title?: string;
  decorative?: boolean;
}) {
  const reactId = useId();
  const gradientId = `${reactId.replace(/:/g, "")}-verse-token`;

  return (
    <svg
      className="verse-token-mark"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}
      <defs>
        <linearGradient
          id={gradientId}
          x1="10"
          y1="4"
          x2="56"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#D946EF" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${gradientId})`} />
      <path
        d="M22.4 20.2 32 43.2"
        stroke="#ffffff"
        strokeWidth="11.5"
        strokeLinecap="round"
      />
      <path
        d="M41.6 20.2 32 43.2"
        stroke="#ffffff"
        strokeWidth="11.5"
        strokeLinecap="round"
        opacity="0.72"
      />
    </svg>
  );
}
