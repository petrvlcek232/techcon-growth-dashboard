'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PasswordGateway from '@/components/PasswordGateway';
import { useState } from 'react';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Kontrola autentizace při mount
  useEffect(() => {
    const authenticated = sessionStorage.getItem('authenticated') === 'true';
    setIsAuthenticated(authenticated);
    
    // Pokud je uživatel autentizován, přesměruj na zákazníky
    if (authenticated) {
      router.push('/customers');
    }
  }, [router]);

  // Zobrazit password gateway, pokud uživatel není autentizován
  if (!isAuthenticated) {
    return <PasswordGateway onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Loading state při přesměrování
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Přesměrovávám...</p>
      </div>
    </div>
  );
}
