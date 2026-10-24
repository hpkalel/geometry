import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const allowedPages = new Set([
  "cone",
  "pyramide",
  "patron",
  "pave",
  "volume",
  "pyr",
  "cyl",
  "prisme",
]);
const allowedEvents = new Set(["page_view", "simulation_interaction"]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 1024) {
    return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Les statistiques ne sont pas configurées." }, { status: 503 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête JSON invalide." }, { status: 400 });
  }

  if (
    !allowedEvents.has(payload?.eventType) ||
    !allowedPages.has(payload?.page) ||
    !uuidPattern.test(payload?.sessionId || "")
  ) {
    return NextResponse.json({ error: "Événement de statistiques invalide." }, { status: 400 });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.from("analytics_events").insert({
    event_type: payload.eventType,
    page: payload.page,
    session_id: payload.sessionId,
  });

  if (error) {
    console.error("Échec de l’enregistrement des statistiques.", error.message);
    return NextResponse.json({ error: "Impossible d’enregistrer l’événement." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
