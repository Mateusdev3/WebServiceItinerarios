import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Itinerarios",
  description: "by Mateusdev3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
    >
      <body className="h-screen flex flex-col bg-app-background w-full px-5">{children}</body>
    </html>
  );
}
