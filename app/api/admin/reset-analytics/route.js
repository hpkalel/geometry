import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server.js";

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Origine de la requête invalide." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("La vérification administrateur a échoué.", adminError.message);
    return NextResponse.json({ error: "Vérification administrateur impossible." }, { status: 500 });
  }
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const { data: deletedCount, error: resetError } = await supabase.rpc("admin_reset_analytics");

  if (resetError) {
    console.error("La réinitialisation des statistiques a échoué.", {
      code: resetError.code,
      message: resetError.message,
      details: resetError.details,
      hint: resetError.hint,
    });
    if (resetError.code === "PGRST202" || resetError.code === "42883") {
      return NextResponse.json(
        {
          error:
            "La fonction de réinitialisation n’existe pas encore dans Supabase. Réexécutez supabase/schema.sql dans le SQL Editor, puis réessayez.",
        },
        { status: 503 },
      );
    }
    if (resetError.code === "42501") {
      return NextResponse.json(
        { error: "Supabase a refusé la suppression. Vérifiez les droits de la fonction admin_reset_analytics." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      {
        error: `Supabase n’a pas pu effacer les statistiques (code ${resetError.code || "inconnu"}). Consultez le terminal du serveur pour le détail.`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ deletedCount });
}
