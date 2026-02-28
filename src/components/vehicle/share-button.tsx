"use client";

import { Share2 } from "lucide-react";

interface Props {
  title: string;
  url: string;
}

export function ShareButton({ title, url }: Props) {
  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
      aria-label="Compartir"
    >
      <Share2 className="size-4" />
    </button>
  );
}
