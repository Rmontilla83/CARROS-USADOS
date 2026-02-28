"use client";

import { useEffect, useRef } from "react";
import { trackView } from "@/lib/actions/analytics";

interface Props {
  vehicleId: string;
}

export function ViewTracker({ vehicleId }: Props) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackView(vehicleId);
  }, [vehicleId]);

  return null;
}
