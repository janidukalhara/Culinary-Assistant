import React from "react";

export type IconName =
  | "chef"
  | "arrow"
  | "upload"
  | "scan"
  | "leaf"
  | "sparkles"
  | "heart"
  | "bag"
  | "clock"
  | "check"
  | "close";
const paths: Record<IconName, React.ReactNode> = {
  chef: (
    <>
      <path d="M6 14a4 4 0 0 1-1-7.9 4 4 0 0 1 7-2 4 4 0 0 1 7 2A4 4 0 0 1 18 14v6H6Z" />
      <path d="M6 16h12" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
    </>
  ),
  scan: (
    <>
      <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 12h18" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 3C9 2 3 7 5 14s14 7 15-11ZM5 20 15 9" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6ZM20 2v4m-2-2h4" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  bag: (
    <>
      <path d="M5 7h14l2 14H3ZM8 8V6a4 4 0 0 1 8 0v2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
};
export default function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
