import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BarberGestor - Sistema para Gestão de Barbearias",
  description: "Centralize agendamentos, fluxo de caixa e comissões.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

// EXPORTAÇÃO CORRETA DO VIEWPORT NO NEXT.JS (AQUI ONDE O TECLADO É CONTROLADO)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c0a09",
  interactiveWidget: "resizes-content", // Impede que o teclado cubra/empurre o conteúdo fixo de forma errada
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-slate-900 selection:text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}