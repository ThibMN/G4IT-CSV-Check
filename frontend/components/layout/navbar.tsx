'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  Home,
  Upload,
  LayoutGrid,
  FileText,
  Database,
  FileOutput,
  AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { id: 1, name: 'Dashboard', href: '/dashboard', icon: <Home className="w-4 h-4" /> },
  { id: 2, name: 'Importation', href: '/dashboard', icon: <Upload className="w-4 h-4" /> },
  { id: 3, name: 'Mapping', href: '/mapping', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 4, name: 'Équipements', href: '/equipment', icon: <FileText className="w-4 h-4" /> },
  { id: 5, name: 'Consolidation', href: '/consolidation', icon: <Database className="w-4 h-4" /> },
  { id: 6, name: 'Exportation', href: '/export', icon: <FileOutput className="w-4 h-4" /> },
  { id: 7, name: 'Gestion des Erreurs', href: '/error-management', icon: <AlertTriangle className="w-4 h-4" /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Pour éviter les erreurs d'hydratation, on s'assure que le rendu se fait uniquement côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Routes qui ne doivent pas afficher la navbar
  const hideNavbarRoutes = ['/login', '/register', '/404', '/500', '/error'];

  // Si on est sur une route où la navbar ne doit pas s'afficher, on ne rend rien
  if (hideNavbarRoutes.some(route => pathname === route)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Link
              href="/dashboard"
              className="flex items-center"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white mr-2">
                G4
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
                G4IT
              </span>
              <span className="text-sm text-gray-500 ml-2 hidden md:inline border-l border-gray-200 pl-2">
                Évaluation d'Impact
              </span>
            </Link>
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isMounted && pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Bouton menu mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100"
          >
            <span className="sr-only">Ouvrir le menu</span>
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="container mx-auto px-4 py-2">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-3 text-sm font-medium rounded-md',
                    isMounted && pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
