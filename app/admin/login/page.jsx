"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser.js";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setErrorMessage(error.message || "La connexion a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-login">
        <a className="admin-back" href="/">← Retour au site</a>
        <p className="admin-eyebrow">Geometry</p>
        <h1>Administration</h1>
        <p className="admin-muted">Connectez-vous pour consulter les statistiques du site.</p>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Adresse e-mail
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {errorMessage ? <p className="admin-error" role="alert">{errorMessage}</p> : null}
          <button type="submit" disabled={submitting}>
            {submitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </section>
    </main>
  );
}
