import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="text-lg font-bold text-gray-900 flex items-center mb-2">
              <span className="text-blue-600 mr-1">G4IT</span>
              <span className="text-sm text-gray-500">| Évaluation d'Impact</span>
            </div>
            <p className="text-gray-600 text-sm">
              Notre plateforme vous aide à évaluer, analyser et réduire l'impact environnemental
              de vos équipements informatiques.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Fonctionnalités
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/mapping" className="text-sm text-gray-600 hover:text-gray-900">
                  Mapping des données
                </Link>
              </li>
              <li>
                <Link href="/equipments" className="text-sm text-gray-600 hover:text-gray-900">
                  Gestion des équipements
                </Link>
              </li>
              <li>
                <Link href="/export" className="text-sm text-gray-600 hover:text-gray-900">
                  Exportation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Aide & Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-sm text-gray-600 hover:text-gray-900">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/documentation" className="text-sm text-gray-600 hover:text-gray-900">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-500 text-sm">
            &copy; {currentYear} G4IT. Tous droits réservés.
          </div>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              Conditions d'utilisation
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
