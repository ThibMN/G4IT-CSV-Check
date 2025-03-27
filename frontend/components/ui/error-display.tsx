"use client";

import { AlertCircle, CheckCircle, XCircle, AlertTriangle, FileWarning, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useErrorStore } from "@/store/error-store";

interface ErrorDisplayProps {
  onRetry?: () => void;
}

export function ErrorDisplay({ onRetry }: ErrorDisplayProps) {
  const { errors, getErrorCount } = useErrorStore();

  // Si aucune erreur, ne rien afficher
  if (errors.length === 0) {
    return null;
  }

  // Compter les erreurs par sévérité
  const errorCounts = getErrorCount();
  const criticalCount = errorCounts.critique;
  const minorCount = errorCounts.mineure;

  // Fonction pour déterminer la couleur en fonction de la sévérité
  const getSeverityColor = (severity: 'critical' | 'warning') => {
    return severity === 'critical' ? 'text-red-500' : 'text-yellow-500';
  };

  // Fonction pour déterminer l'icône en fonction de la sévérité
  const getSeverityIcon = (severity: 'critical' | 'warning') => {
    return severity === 'critical' ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileWarning className="h-5 w-5 text-red-500" />
          <span>Problèmes détectés</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Résumé des erreurs */}
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-500 font-medium">{criticalCount}</span>
              <span className="text-gray-500">critique{criticalCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500 font-medium">{minorCount}</span>
              <span className="text-gray-500">mineure{minorCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Liste des erreurs */}
          <div className="space-y-3">
            {errors.map((error, index) => (
              <div
                key={index}
                className="border p-3 rounded-md bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-2">
                    <div className={`mt-0.5 ${getSeverityColor(error.severity as 'critical' | 'warning')}`}>
                      {getSeverityIcon(error.severity as 'critical' | 'warning')}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{error.type}</div>
                      <div className="text-sm text-gray-600">
                        Colonne: <span className="font-mono text-gray-800">{error.column}</span>
                        {error.row && <span> | Ligne: {error.row}</span>}
                        {error.value && <span> | Valeur: <span className="font-mono">{error.value}</span></span>}
                      </div>
                      <div className="text-sm mt-1">{error.message}</div>

                      {error.suggestions && error.suggestions.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="font-medium text-gray-700">Suggestions:</div>
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            {error.suggestions.map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => console.log('Marquer comme corrigée', error)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Marquer comme corrigé
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton de réessai si fourni */}
          {onRetry && (
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={onRetry}
                className="flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Réessayer</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
