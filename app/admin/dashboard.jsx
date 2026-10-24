"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser.js";

const pageNames = {
  cone: "Section du cône",
  pyramide: "Section de la pyramide",
  patron: "Patron du cône",
  pave: "Patron du pavé droit",
  volume: "Volume du pavé droit",
  pyr: "Volume de la pyramide",
  cyl: "Volume du cône",
  prisme: "Volume du prisme droit",
};

function formatDate(value) {
  return new Intl.DateTimeFormat("fr", { day: "numeric", month: "short" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function formatChartDate(value, index) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(
    "fr",
    index === 0 || date.getDate() === 1 ? { day: "numeric", month: "short" } : { day: "numeric" },
  ).format(date);
}

export default function AdminDashboard({ summary }) {
  const router = useRouter();
  const resetDialogRef = useRef(null);
  const [theme, setTheme] = useState("dark");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const allDays = summary.daily || [];
  const firstVisitIndex = allDays.findIndex((day) => day.visits > 0);
  const days = firstVisitIndex < 0 ? [] : allDays.slice(firstVisitIndex);
  const maxVisits = Math.max(1, ...days.map((day) => day.visits));
  const metrics = [
    {
      label: "Visiteurs aujourd’hui",
      value: summary.unique_visitors_today,
      note: "Sessions anonymes uniques",
      icon: "users",
      color: "teal",
    },
    {
      label: "Pages vues",
      value: summary.visits_today,
      note: "Aujourd’hui",
      icon: "eye",
      color: "blue",
    },
    {
      label: "Ce mois-ci",
      value: summary.visits_month,
      note: "Pages vues",
      icon: "calendar",
      color: "purple",
    },
    {
      label: "En ligne maintenant",
      value: summary.online_now,
      note: "Actifs durant les 5 dernières minutes",
      icon: "activity",
      color: "orange",
    },
  ];

  useEffect(() => {
    const nextTheme =
      document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    const dialog = resetDialogRef.current;
    if (!dialog) return;

    if (resetDialogOpen && !dialog.open) dialog.showModal();
    if (!resetDialogOpen && dialog.open) dialog.close();
  }, [resetDialogOpen]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("theme", nextTheme);
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("La déconnexion a échoué.", error.message);
      return;
    }
    router.replace("/admin/login");
    router.refresh();
  }

  async function resetStatistics() {
    setResetPending(true);
    setResetMessage("");
    setResetError("");

    try {
      const response = await fetch("/api/admin/reset-analytics", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        setResetError(result.error || "Impossible de réinitialiser les statistiques.");
        return;
      }
      setResetMessage("Les statistiques ont été réinitialisées.");
      setResetDialogOpen(false);
      router.refresh();
    } catch (error) {
      setResetError(
        error instanceof Error
          ? `La requête a échoué : ${error.message}`
          : "La requête de réinitialisation a échoué. Vérifiez votre connexion et réessayez.",
      );
    } finally {
      setResetPending(false);
    }
  }

  function metricIcon(name) {
    const paths = {
      users: (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ),
      eye: (
        <>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ),
      calendar: (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01" />
        </>
      ),
      activity: (
        <>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M7 12h3l2-4 3 8 2-4h2" />
        </>
      ),
      chart: <path d="M3 3v18h18M7 14l4-4 4 3 6-7M17 6h4v4" />,
    };

    return (
      <svg
        className={`admin-metric-icon admin-icon-${name}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {paths[name]}
      </svg>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-dashboard">
        <header className="admin-header">
          <div className="admin-heading">
            <span className="admin-heading-icon">{metricIcon("chart")}</span>
            <div>
              <h1>Tableau de bord</h1>
              <p className="admin-subtitle">Suivez l’activité de Geometry en un coup d’œil.</p>
            </div>
          </div>
          <div className="admin-actions">
            <button
              className="admin-secondary admin-theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
              title={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" /></svg>
              )}
            </button>
            <a className="admin-secondary admin-return" href="/">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18 9 12l6-6M9 12h11" /></svg>
              Retour au site
            </a>
            <button className="admin-secondary admin-signout" type="button" onClick={signOut}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3m9-8h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" /></svg>
              Déconnexion
            </button>
          </div>
        </header>

        <div className="admin-reset-row">
          <div>
            <h2>Réinitialiser les statistiques</h2>
            <p>Efface toutes les visites et interactions enregistrées.</p>
          </div>
          <button
            className="admin-secondary admin-reset-button"
            type="button"
            onClick={() => {
              setResetError("");
              setResetDialogOpen(true);
            }}
            disabled={resetPending}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-.9 14H5.9L5 6m4 4v6m6-6v6" /></svg>
            Tout effacer
          </button>
          {resetMessage && <p className="admin-reset-message" role="status">{resetMessage}</p>}
        </div>

        <dialog
          className="admin-reset-dialog"
          ref={resetDialogRef}
          aria-labelledby="admin-reset-title"
          aria-describedby="admin-reset-description"
          onClose={() => setResetDialogOpen(false)}
          onCancel={(event) => {
            if (resetPending) event.preventDefault();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget && !resetPending) setResetDialogOpen(false);
          }}
        >
          <div className="admin-reset-dialog-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 1.9 18.4A1.8 1.8 0 0 0 3.5 21h17a1.8 1.8 0 0 0 1.6-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
          </div>
          <h2 id="admin-reset-title">Réinitialiser les statistiques ?</h2>
          <p id="admin-reset-description">
            Cette action supprimera définitivement toutes les visites et interactions enregistrées. Elle est irréversible.
          </p>
          {resetError && <p className="admin-reset-dialog-error" role="alert">{resetError}</p>}
          <div className="admin-reset-dialog-actions">
            <button
              className="admin-secondary"
              type="button"
              onClick={() => setResetDialogOpen(false)}
              disabled={resetPending}
              autoFocus
            >
              Annuler
            </button>
            <button
              className="admin-secondary admin-reset-confirm"
              type="button"
              onClick={resetStatistics}
              disabled={resetPending}
            >
              {resetPending ? "Suppression…" : "Oui, tout effacer"}
            </button>
          </div>
        </dialog>

        <section className="admin-section" aria-labelledby="admin-overview-title">
          <div className="admin-section-heading">
            <h2 id="admin-overview-title">Vue d’ensemble</h2>
            <p>Les chiffres clés de votre site</p>
          </div>
          <div className="admin-stats" aria-label="Statistiques du jour et du mois">
            {metrics.map((metric) => (
              <article className={`admin-card admin-card-${metric.color}`} key={metric.label}>
                <div className="admin-card-top">
                  <span>{metric.label}</span>
                  {metricIcon(metric.icon)}
                </div>
                <strong>{(metric.value ?? 0).toLocaleString("fr")}</strong>
                <small>{metric.note}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-interactions" aria-label="Interactions avec les simulations">
          <span className="admin-interactions-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </span>
          <div>
            <h2>Interactions avec les simulations</h2>
            <p>Sur les 30 derniers jours</p>
          </div>
          <strong>{(summary.interactions ?? 0).toLocaleString("fr")}</strong>
        </section>

        <section className="admin-panels">
          <article className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Pages les plus consultées</h2>
                <p>Contenus les plus visités sur 30 jours</p>
              </div>
            </div>
            {summary.pages.length ? (
              <ol className="admin-page-list">
                {summary.pages.map((page) => (
                  <li key={page.page}>
                    <span>{pageNames[page.page] || page.page}</span>
                    <strong>{page.visits.toLocaleString("fr")}</strong>
                  </li>
                ))}
              </ol>
            ) : <p className="admin-muted">Aucune visite enregistrée pour le moment.</p>}
          </article>

          <article className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Visites quotidiennes</h2>
                <p>Évolution sur les 30 derniers jours</p>
              </div>
            </div>
            {days.length ? (
              <div className="admin-chart">
                {days.map((day, index) => (
                  <div className="admin-chart-column" key={day.date} title={`${formatDate(day.date)} : ${day.visits} visite(s)`}>
                    <span className="admin-chart-value">{day.visits || ""}</span>
                    <div className="admin-chart-track">
                      <div className="admin-chart-bar" style={{ height: `${Math.max(3, (day.visits / maxVisits) * 100)}%` }} />
                    </div>
                    <span className="admin-chart-date">
                      {index === 0 ||
                      index === days.length - 1 ||
                      index % 5 === 0 ||
                      new Date(`${day.date}T12:00:00`).getDate() === 1
                        ? formatChartDate(day.date, index)
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="admin-muted">Aucune donnée disponible.</p>}
          </article>
        </section>
        <p className="admin-privacy">Les visiteurs uniques correspondent aux sessions anonymes d’un onglet et ne permettent pas d’identifier une personne. Les événements ne contiennent ni adresse IP, ni compte utilisateur, ni valeur des contrôles. Le compteur « En ligne maintenant » inclut les onglets ayant généré une activité dans les cinq dernières minutes.</p>
      </div>
    </main>
  );
}
