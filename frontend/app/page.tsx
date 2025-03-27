'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderData } from '@/components/ui/loader-data';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection vers le dashboard après un court délai
    const redirectTimeout = setTimeout(() => {
      router.push('/dashboard');
    }, 100);

    return () => clearTimeout(redirectTimeout);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 mx-auto text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-600">G4IT</h1>
          <p className="text-gray-600 mt-2">Outil d'Évaluation d'Impact Environnemental</p>
        </div>

        <LoaderData />
        <p className="mt-4 text-gray-500">Redirection vers le dashboard...</p>
      </div>
    </div>
  );
}
