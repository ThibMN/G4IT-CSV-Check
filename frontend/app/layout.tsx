import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { NotificationToast } from '@/components/ui/notifications';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "G4IT - Outil d'Évaluation d'Impact Environnemental Numérique",
  description: "Plateforme pour analyser et réduire l'impact environnemental des équipements informatiques",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
        <NotificationToast />
      </body>
    </html>
  );
}
