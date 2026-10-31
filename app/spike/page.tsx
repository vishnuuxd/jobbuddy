"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { Spike } from "./Spike";

export default function SpikePage() {
  return (
    <ConversationProvider>
      <Spike />
    </ConversationProvider>
  );
}
