import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: "Set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in .env.local" },
      { status: 500 },
    );
  }

  const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
  url.searchParams.set("agent_id", agentId);

  const res = await fetch(url, { headers: { "xi-api-key": apiKey }, cache: "no-store" });

  if (!res.ok) {
    return NextResponse.json(
      { error: `ElevenLabs returned ${res.status}`, detail: await res.text() },
      { status: 502 },
    );
  }

  const { signed_url: signedUrl } = (await res.json()) as { signed_url: string };
  return NextResponse.json({ signedUrl }, { headers: { "Cache-Control": "no-store" } });
}
