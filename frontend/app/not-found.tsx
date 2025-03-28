import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 mx-auto text-center bg-white rounded-lg shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <SearchX className="h-8 w-8 text-blue-600" />
        </div>

        <h1 className="mt-6 text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-2 text-2xl font-semibold text-gray-700">Page non trouvée</h2>

        <p className="mt-4 text-gray-600">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild>
            <Link href="/dashboard">
              Retour au dashboard
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/">
              Page d'accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
