"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { CallScreen } from "./CallScreen";

export default function CallPage() {
  return (
    <ConversationProvider>
      <CallScreen />
    </ConversationProvider>
  );
}
