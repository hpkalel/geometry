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

function getSessionId() {
  const key = "geometry-analytics-session";
  let sessionId = window.sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = window.crypto.randomUUID();
    window.sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

export function trackAnalytics(eventType, page) {
  if (
    !allowedPages.has(page) ||
    !["page_view", "simulation_interaction"].includes(eventType) ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return;
  }

  let sessionId;
  try {
    sessionId = getSessionId();
  } catch (error) {
    console.warn("Impossible d’initialiser la session de statistiques.", error);
    return;
  }

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, page, sessionId }),
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok) {
        console.warn("La collecte des statistiques a échoué.", response.status);
      }
    })
    .catch((error) => {
      console.warn("La collecte des statistiques est indisponible.", error);
    });
}
