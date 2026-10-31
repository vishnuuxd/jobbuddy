"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { Spike } from "./Spike";

export default function CallPage() {
  return (
    <ConversationProvider>
      <Spike />
    </ConversationProvider>
  );
}
