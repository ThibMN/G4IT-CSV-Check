"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileWarning,
  ArrowRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useErrorStore, FileError } from "@/store/error-store";
import Navbar from "@/components/layout/navbar";
import { useNotification } from "@/components/ui/notifications";

// Composant pour afficher une badge indiquant la gravité d'une erreur
const ErrorBadge = ({ severity }: { severity: 'critique' | 'mineure' }) => {
  return (
    <Badge
      variant="outline"
      className={`
        ${severity === 'critique'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
        }
      `}
    >
      {severity === 'critique' ? (
        <><XCircle className="h-3.5 w-3.5 mr-1" /> Critique</>
      ) : (
        <><AlertTriangle className="h-3.5 w-3.5 mr-1" /> Mineure</>
      )}
    </Badge>
  );
};

// Composant pour afficher une alerte récapitulative des erreurs
const ErrorSummary = ({ critique, mineure }: { critique: number; mineure: number }) => {
  if (critique === 0 && mineure === 0) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-6 flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
        <div>
          <h3 className="font-medium">Aucune erreur détectée</h3>
          <p className="text-sm">Votre fichier est prêt à être exporté.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      ${critique > 0
        ? 'bg-red-50 border border-red-200 text-red-800'
        : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
      }
      rounded-md p-4 mb-6 flex items-start gap-3
    `}>
      {critique > 0 ? (
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
      )}

      <div>
        <h3 className="font-medium">
          {critique > 0
            ? `${critique} erreur${critique > 1 ? 's' : ''} critique${critique > 1 ? 's' : ''} détectée${critique > 1 ? 's' : ''}`
            : 'Aucune erreur critique détectée'
          }
        </h3>
        <p className="text-sm">
          {critique > 0
            ? 'Ces erreurs doivent être corrigées avant de pouvoir exporter le fichier.'
            : `${mineure} erreur${mineure > 1 ? 's' : ''} mineure${mineure > 1 ? 's' : ''} à corriger pour améliorer la qualité des données.`
          }
        </p>
      </div>
    </div>
  );
};

// Composant de ligne d'erreur éditable
const EditableErrorRow = ({
  error,
  onUpdate,
  onMarkCorrected
}: {
  error: FileError;
  onUpdate: (id: number, value: string) => void;
  onMarkCorrected: (id: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(error.correction || error.valeur || '');

  // Gérer la sauvegarde de la valeur modifiée
  const handleSave = () => {
    onUpdate(error.id, value);
    setIsEditing(false);
  };

  // Gérer l'annulation de l'édition
  const handleCancel = () => {
    setValue(error.correction || error.valeur || '');
    setIsEditing(false);
  };

  return (
    <TableRow className={error.corrigee ? "bg-green-50" : ""}>
      <TableCell>
        <div className="flex items-start gap-2">
          <ErrorBadge severity={error.gravite} />
          <div>
            <div className="font-medium">{error.type}</div>
            <div className="text-sm text-gray-500">Colonne: <span className="font-mono">{error.colonne}</span></div>
          </div>
        </div>
      </TableCell>

      <TableCell>
        {error.valeur ? (
          <span className={error.gravite === 'critique' ? "text-red-600 font-mono" : "text-yellow-600 font-mono"}>
            {error.valeur || '<vide>'}
          </span>
        ) : (
          <span className="text-red-600 italic">manquant</span>
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <div className="flex gap-2 items-center">
            <Input
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
              className="h-8 w-full max-w-xs"
              autoFocus
            />
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 px-2">
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} className="h-7 px-2">
                <Check className="h-3.5 w-3.5 mr-1" />
                Valider
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-blue-600 font-mono">{error.suggestion}</div>
        )}
      </TableCell>

      <TableCell className="text-right">
        {error.corrigee ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Corrigée
          </Badge>
        ) : (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8"
            >
              Modifier
            </Button>
            <Button
              size="sm"
              onClick={() => onMarkCorrected(error.id)}
              className="h-8"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Corriger
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

// Composant principal pour la page de gestion des erreurs
export default function ErrorManagement() {
  // Récupérer les erreurs depuis le store
  const {
    errors,
    updateError,
    markErrorAsCorrected,
    getErrorCount,
    hasCriticalErrors
  } = useErrorStore();

  // État pour les erreurs à afficher (filtrées ou non)
  const [showOnlyUncorrected, setShowOnlyUncorrected] = useState(true);

  // Filtre des erreurs selon l'état (corrigées/non corrigées)
  const filteredErrors = showOnlyUncorrected
    ? errors.filter(err => !err.corrigee)
    : errors;

  // Regrouper les erreurs par gravité
  const criticalErrors = filteredErrors.filter(err => err.gravite === 'critique' && !err.corrigee);
  const minorErrors = filteredErrors.filter(err => err.gravite === 'mineure' && !err.corrigee);
  const correctedErrors = filteredErrors.filter(err => err.corrigee);

  // Mettre en ordre les erreurs : d'abord critiques, puis mineures, puis corrigées
  const orderedErrors = [...criticalErrors, ...minorErrors, ...correctedErrors];

  // Composant pour afficher une alerte récapitulative des erreurs
  const ErrorSummary = ({ critique, mineure }: { critique: number; mineure: number }) => {
    if (critique === 0 && mineure === 0) {
      return (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <h3 className="font-medium">Aucune erreur détectée</h3>
            <p className="text-sm">Votre fichier est prêt à être exporté.</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`
        ${critique > 0
          ? 'bg-red-50 border border-red-200 text-red-800'
          : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
        }
        rounded-md p-4 mb-6 flex items-start gap-3
      `}>
        {critique > 0 ? (
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
        )}

        <div>
          <h3 className="font-medium">
            {critique > 0
              ? `${critique} erreur${critique > 1 ? 's' : ''} critique${critique > 1 ? 's' : ''} détectée${critique > 1 ? 's' : ''}`
              : 'Aucune erreur critique détectée'
            }
          </h3>
          <p className="text-sm">
            {critique > 0
              ? 'Ces erreurs doivent être corrigées avant de pouvoir exporter le fichier.'
              : `${mineure} erreur${mineure > 1 ? 's' : ''} mineure${mineure > 1 ? 's' : ''} à corriger pour améliorer la qualité des données.`
            }
          </p>
        </div>
      </div>
    );
  };

  // Composant de ligne d'erreur éditable
  const EditableErrorRow = ({
    error,
    onUpdate,
    onMarkCorrected
  }: {
    error: FileError;
    onUpdate: (id: number, value: string) => void;
    onMarkCorrected: (id: number) => void;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(error.correction || error.valeur || '');

    // Gérer la sauvegarde de la valeur modifiée
    const handleSave = () => {
      onUpdate(error.id, value);
      setIsEditing(false);
    };

    // Gérer l'annulation de l'édition
    const handleCancel = () => {
      setValue(error.correction || error.valeur || '');
      setIsEditing(false);
    };

    return (
      <TableRow className={error.corrigee ? "bg-green-50" : ""}>
        <TableCell>
          <div className="flex items-start gap-2">
            <ErrorBadge severity={error.gravite} />
            <div>
              <div className="font-medium">{error.type}</div>
              <div className="text-sm text-gray-500">Colonne: <span className="font-mono">{error.colonne}</span></div>
            </div>
          </div>
        </TableCell>

        <TableCell>
          {error.valeur ? (
            <span className={error.gravite === 'critique' ? "text-red-600 font-mono" : "text-yellow-600 font-mono"}>
              {error.valeur || '<vide>'}
            </span>
          ) : (
            <span className="text-red-600 italic">manquant</span>
          )}
        </TableCell>

        <TableCell>
          {isEditing ? (
            <div className="flex gap-2 items-center">
              <Input
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                className="h-8 w-full max-w-xs"
                autoFocus
              />
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 px-2">
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} className="h-7 px-2">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Valider
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-blue-600 font-mono">{error.suggestion}</div>
          )}
        </TableCell>

        <TableCell className="text-right">
          {error.corrigee ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Corrigée
            </Badge>
          ) : (
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8"
              >
                Modifier
              </Button>
              <Button
                size="sm"
                onClick={() => onMarkCorrected(error.id)}
                className="h-8"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Corriger
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  // Composant principal pour la page de gestion des erreurs
  export default function ErrorManagement() {
    // Récupérer les erreurs depuis le store
    const {
      errors,
      updateError,
      markErrorAsCorrected,
      getErrorCount,
      hasCriticalErrors
    } = useErrorStore();
  
    // État pour les erreurs à afficher (filtrées ou non)
    const [showOnlyUncorrected, setShowOnlyUncorrected] = useState(true);
  
    // Filtre des erreurs selon l'état (corrigées/non corrigées)
    const filteredErrors = showOnlyUncorrected
      ? errors.filter(err => !err.corrigee)
      : errors;
  
    // Regrouper les erreurs par gravité
    const criticalErrors = filteredErrors.filter(err => err.gravite === 'critique' && !err.corrigee);
    const minorErrors = filteredErrors.filter(err => err.gravite === 'mineure' && !err.corrigee);
    const correctedErrors = filteredErrors.filter(err => err.corrigee);
  
    // Mettre en ordre les erreurs : d'abord critiques, puis mineures, puis corrigées
    const orderedErrors = [...criticalErrors, ...minorErrors, ...correctedErrors];
  
    // Comter les erreurs
    const errorCounts = getErrorCount();
  
    // Gérer la mise à jour d'une erreur
    // Ajouter les imports pour les fonctions API
    import { correctError, applyCorrections } from "@/services/api";
  
    const notification = useNotification();
  
    const handleUpdateError = async (id: number, value: string) => {
      if (!filePath) {
        notification.error("Impossible de corriger l'erreur: chemin du fichier non trouvé");
        return;
      }
  
      const errorToUpdate = errors.find(err => err.id === id);
      if (!errorToUpdate) return;
  
      try {
        // Appeler l'API pour corriger l'erreur
        const result = await correctError(filePath, {
          column: errorToUpdate.colonne,
          row: errorToUpdate.ligne || 0, // Assurez-vous que votre modèle d'erreur contient le numéro de ligne
          value: errorToUpdate.valeur,
          correction: value
        });
  
        if (result.success) {
          // Mettre à jour l'erreur localement
          updateError(id, { correction: value });
          markErrorAsCorrected(id, value);
          
          notification.success("Correction appliquée avec succès");
        } else {
          notification.error(result.message || "Erreur lors de la correction");
        }
      } catch (error: any) {
        console.error("Erreur lors de la correction:", error);
        notification.error(`Erreur lors de la correction: ${error.message || "Erreur inconnue"}`);
      }
    };
  
    // Ajouter une fonction pour appliquer toutes les corrections
    const handleApplyAllCorrections = async () => {
      if (!filePath) {
        notification.error("Impossible d'appliquer les corrections: chemin du fichier non trouvé");
        return;
      }
  
      // Récupérer toutes les erreurs corrigées
      const correctedErrors = errors
        .filter(err => err.corrigee)
        .map(err => ({
          column: err.colonne,
          row: err.ligne || 0,
          value: err.valeur,
          correction: err.correction || ""
        }));
  
      if (correctedErrors.length === 0) {
        notification.warning("Aucune correction à appliquer");
        return;
      }
  
      setIsApplyingCorrections(true);
  
      try {
        // Appeler l'API pour appliquer toutes les corrections
        const result = await applyCorrections(filePath, correctedErrors);
  
        if (result.success) {
          notification.success("Toutes les corrections ont été appliquées avec succès!");
          
          // Mettre à jour le chemin du fichier si un nouveau fichier a été généré
          if (result.corrected_file_path) {
            localStorage.setItem('tempFilePath', result.corrected_file_path);
            setFilePath(result.corrected_file_path);
          }
          
          // Rediriger vers la page suivante après un court délai
          setTimeout(() => {
            router.push('/mapping');
          }, 2000);
        } else {
          notification.error(result.message || "Erreur lors de l'application des corrections");
        }
      } catch (error: any) {
        console.error("Erreur lors de l'application des corrections:", error);
        notification.error(`Erreur lors de l'application des corrections: ${error.message || "Erreur inconnue"}`);
      } finally {
        setIsApplyingCorrections(false);
      }
    };
  
    // Marquer une erreur comme corrigée
    const handleMarkCorrected = (id: number) => {
      markErrorAsCorrected(id);
    };
  
    // Vérifier s'il y a des erreurs à afficher
    const hasErrors = filteredErrors.length > 0;
  
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-3 mb-6">
            <FileWarning className="h-7 w-7 text-red-500" />
            <h1 className="text-3xl font-bold">Gestion des Erreurs</h1>
          </div>
  
          {/* Résumé des erreurs */}
          <ErrorSummary critique={errorCounts.critique} mineure={errorCounts.mineure} />
  
          {/* Carte principale */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Liste des Erreurs Détectées</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOnlyUncorrected(!showOnlyUncorrected)}
                  >
                    {showOnlyUncorrected ? 'Afficher toutes les erreurs' : 'Masquer les erreurs corrigées'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!hasErrors ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-lg mb-2">Aucune erreur à afficher</p>
                  <p className="text-sm">
                    {showOnlyUncorrected
                      ? "Toutes les erreurs ont été corrigées ! Vous pouvez procéder à l'exportation."
                      : "Aucune erreur n'a été détectée dans votre fichier."
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type d'erreur</TableHead>
                        <TableHead>Valeur actuelle</TableHead>
                        <TableHead>Correction suggérée</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderedErrors.map((error) => (
                        <EditableErrorRow
                          key={error.id}
                          error={error}
                          onUpdate={handleUpdateError}
                          onMarkCorrected={handleMarkCorrected}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={() => window.history.back()}>
                Retour
              </Button>
              <Button
                disabled={hasCriticalErrors()}
                onClick={() => window.location.href = '/export'}
                className="flex items-center gap-2"
              >
                Corriger et valider <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Ajouter un bouton pour appliquer toutes les corrections
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... existing JSX ... */}
      
      {/* Ajouter un message de succès */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <p className="text-sm">{successMessage}</p>
          </div>
        </div>
      )}
      
      {/* Ajouter un bouton pour appliquer toutes les corrections */}
      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleApplyAllCorrections}
          disabled={isApplyingCorrections || !hasCorrectedErrors}
          className="flex items-center gap-2"
        >
          {isApplyingCorrections ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Application des corrections...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Appliquer toutes les corrections
            </>
          )}
        </Button>
      </div>
      
      {/* ... existing JSX ... */}
    </div>
  );
}
