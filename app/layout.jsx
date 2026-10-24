import "../src/styles.css";

const description =
  "Geometry est un site pédagogique consacré aux configurations dans l’espace dans les classes du premier cycle.";

export const metadata = {
  title: "Geometry : cône et pyramide",
  description,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: "Geometry",
    description,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Geometry",
    description,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var savedTheme = localStorage.getItem("theme");
              if (savedTheme === "light" || savedTheme === "dark") {
                document.documentElement.setAttribute("data-theme", savedTheme);
              }
            } catch {}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
