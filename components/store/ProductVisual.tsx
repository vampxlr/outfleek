"use client";

export default function ProductVisual({
  image,
  hue = 40,
  name,
  className = "",
}: {
  image?: string | null;
  hue?: number;
  name: string;
  className?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className={`h-full w-full object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  const c1 = `hsl(${hue}, 26%, 91%)`;
  const c2 = `hsl(${hue}, 22%, 80%)`;
  const tee = `hsl(${hue}, 18%, 30%)`;
  return (
    <div
      aria-label={name}
      role="img"
      className={`flex h-full w-full items-center justify-center ${className}`}
      style={{ background: `linear-gradient(145deg, ${c1} 0%, ${c2} 100%)` }}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-auto w-[52%] opacity-90"
        style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,.10))" }}
      >
        <path
          fill={tee}
          stroke="rgba(0,0,0,.12)"
          strokeWidth="1"
          d="M35 12 L20 20 L8 38 L20 46 L24 38 L24 88 L76 88 L76 38 L80 46 L92 38 L80 20 L65 12 C62 19 56 22 50 22 C44 22 38 19 35 12 Z"
        />
      </svg>
    </div>
  );
}
