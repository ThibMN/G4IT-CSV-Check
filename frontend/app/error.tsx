'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 mx-auto text-center bg-white rounded-lg shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-gray-900">Une erreur est survenue</h2>

        <p className="mt-4 text-gray-600">
          Nous n'avons pas pu charger la page demandée. Veuillez essayer à nouveau
          ou contacter le support si le problème persiste.
        </p>

        {error.message && (
          <div className="mt-4 p-3 bg-red-50 rounded text-sm text-red-800 text-left overflow-auto">
            <code>{error.message}</code>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Button
            onClick={() => reset()}
            className="flex items-center justify-center"
          >
            Réessayer
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center justify-center"
          >
            Retour au dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
