import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin", "vietnamese"] });

export const metadata = {
  title: "Sotka",
  description: "A front-end page of Sotka Retrieval System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={ibmPlexSans.className}>{children}</body>
    </html>
  );
}
