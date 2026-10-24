import { redirect } from "next/navigation";
import AdminDashboard from "./dashboard.jsx";
import { createSupabaseServerClient } from "../../lib/supabase/server.js";

export const metadata = {
  title: "Statistiques | Geometry",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="admin-shell">
        <section className="admin-login">
          <p className="admin-eyebrow">Geometry</p>
          <h1>Configuration requise</h1>
          <p className="admin-muted">
            Configurez les variables Supabase dans <code>.env.local</code>, puis suivez les
            étapes du README pour créer l’administrateur et la base de statistiques.
          </p>
        </section>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/admin/login");

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) throw new Error(`Vérification administrateur impossible : ${adminError.message}`);
  if (!admin) redirect("/admin/login?error=unauthorized");

  const { data: summary, error: summaryError } = await supabase.rpc("admin_analytics", { p_days: 30 });
  if (summaryError) throw new Error(`Chargement des statistiques impossible : ${summaryError.message}`);
  if (!summary) throw new Error("La base de données n’a renvoyé aucune statistique.");

  return <AdminDashboard summary={summary} />;
}
