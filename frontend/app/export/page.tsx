"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Download, AlertCircle, RefreshCw, FileDown, Trash2, Loader2, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useEquipmentStore } from "@/store/equipment-store";
import { useExportStore, ExportFile } from "@/store/export-store";
import { useErrorStore } from "@/store/error-store";
import { exportCSV, validateExportData } from "@/lib/csv-utils";
import Navbar from "@/components/layout/navbar";
import FileValidator from "@/components/ui/file-validator";
import { useRouter } from "next/navigation";

// Message d'alerte
const AlertMessage = ({ title, message, type = "warning" }: { title: string; message: string; type?: "warning" | "error" }) => {
  return (
    <div className={`
      ${type === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-red-50 border-red-200 text-red-800"}
      rounded-md p-4 mb-6 flex items-start gap-3 border
    `}>
      <AlertCircle className={`h-5 w-5 ${type === "warning" ? "text-yellow-500" : "text-red-500"} mt-0.5`} />
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

// Message d'erreur
const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-medium">Erreur</h3>
        <p className="text-sm">{message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="flex items-center gap-1">
        <RefreshCw className="h-4 w-4" />
        Réessayer
      </Button>
    </div>
  );
};

// Pas de données à exporter
const NoData = () => {
  return (
    <div className="text-center py-10 text-gray-500">
      <p>Aucune donnée à exporter n'a été trouvée.</p>
      <p className="text-sm mt-1">Veuillez d'abord ajouter des équipements et les consolider.</p>
    </div>
  );
};

// Pas d'historique d'export
const NoExportHistory = () => {
  return (
    <div className="text-center py-6 text-gray-500">
      <p>Aucun export dans l'historique.</p>
      <p className="text-sm mt-1">Vous verrez ici la liste des fichiers exportés.</p>
    </div>
  );
};

export default function ExportPage() {
  // États locaux
  const [isExporting, setIsExporting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ title: string; message: string; type: "warning" | "error" } | null>(null);
  const router = useRouter();

  // Accès aux stores Zustand
  const { consolidatedEquipments } = useEquipmentStore();
  const {
    exports,
    addExport,
    removeExport,
    error,
    setError,
    isLoading,
    setLoading
  } = useExportStore();
  const { errors: validationErrors, hasCriticalErrors } = useErrorStore();

  // Vérifier s'il y a des données à exporter
  const hasNoData = consolidatedEquipments.length === 0;

  // Valider les données pour l'export
  const validationResult = hasNoData ?
    { isValid: false, redirectToErrorPage: false, errors: ["Aucune donnée à exporter"] } :
    validateExportData(consolidatedEquipments);

  // Gérer l'export CSV
  const handleExport = async () => {
    if (hasNoData) {
      setAlertMessage({
        title: "Impossible d'exporter",
        message: "Aucune donnée n'est disponible pour l'exportation.",
        type: "error"
      });
      return;
    }

    // Vérifier si des erreurs de validation existent
    if (!validationResult.isValid) {
      if (validationResult.redirectToErrorPage) {
        router.push('/error-management');
        return;
      }

      setAlertMessage({
        title: "Validation échouée",
        message: validationResult.errors.join("; "),
        type: "error"
      });
      return;
    }

    setIsExporting(true);
    setError(null);
    setAlertMessage(null);

    try {
      // Générer le nom du fichier
      const fileName = `Export_Equipements_${new Date().toISOString().split('T')[0]}`;

      // Exporter le CSV
      const exportResult = exportCSV(consolidatedEquipments, fileName, true);

      if (!exportResult.success) {
        throw new Error(exportResult.error);
      }

      // Ajouter à l'historique des exports
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];

      addExport({
        id: uuidv4(),
        nom: exportResult.fileName!,
        date: formattedDate,
        donnees: [...consolidatedEquipments]
      });

    } catch (err: any) {
      console.error("Erreur lors de l'export CSV:", err);
      setError("Impossible d'exporter le fichier CSV. Veuillez réessayer.");
      setAlertMessage({
        title: "Erreur d'exportation",
        message: err.message || "Une erreur s'est produite lors de l'exportation.",
        type: "error"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Télécharger un export précédent
  const handleDownloadExport = (exportFile: ExportFile) => {
    try {
      const result = exportCSV(exportFile.donnees, exportFile.nom, true);

      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error("Erreur lors du téléchargement de l'export:", err);
      setError("Impossible de télécharger ce fichier. Veuillez réessayer.");
      setAlertMessage({
        title: "Erreur de téléchargement",
        message: err.message || "Une erreur s'est produite lors du téléchargement.",
        type: "error"
      });
    }
  };

  // Supprimer un export de l'historique
  const handleDeleteExport = (id: string) => {
    removeExport(id);
  };

  // Recharger les exports (simulé)
  const handleRetry = () => {
    setError(null);
    setLoading(true);

    // Simuler un chargement
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // Importer et valider un nouveau fichier
  const handleFileValidated = (data: any[]) => {
    // Logique supplémentaire si nécessaire
    console.log("Fichier validé avec succès:", data.length, "lignes");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Exportation des Données</h1>

        {/* Message d'erreur */}
        {error && <ErrorMessage message={error} onRetry={handleRetry} />}

        {/* Message d'alerte */}
        {alertMessage && (
          <AlertMessage
            title={alertMessage.title}
            message={alertMessage.message}
            type={alertMessage.type}
          />
        )}

        {/* Alerte pour les erreurs de validation */}
        {!validationResult.isValid && validationResult.redirectToErrorPage && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6 flex items-start gap-3">
            <FileWarning className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium">Des erreurs doivent être corrigées avant l'exportation</h3>
              <p className="text-sm">
                {validationErrors.length} problème{validationErrors.length > 1 ? 's' : ''} {validationErrors.length > 1 ? 'ont été détectés' : 'a été détecté'} dans vos données.
              </p>
            </div>
            <Button
              onClick={() => router.push('/error-management')}
              className="flex items-center gap-1"
            >
              <FileWarning className="h-4 w-4" />
              Gérer les erreurs
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Carte d'importation et validation */}
          <Card>
            <CardHeader>
              <CardTitle>Importer et Valider les Données</CardTitle>
            </CardHeader>
            <CardContent>
              <FileValidator
                onValidFile={handleFileValidated}
                label="Sélectionnez un fichier CSV ou XLSX à valider"
                buttonText="Parcourir"
              />
            </CardContent>
          </Card>

          {/* Carte d'exportation */}
          <Card>
            <CardHeader>
              <CardTitle>Exporter les Données</CardTitle>
            </CardHeader>
            <CardContent>
              {hasNoData ? (
                <NoData />
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Vous pouvez exporter vos données consolidées au format CSV. Le fichier sera
                    généré avec un nom contenant la date d'aujourd'hui.
                  </p>

                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FileDown className="h-5 w-5 text-blue-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Contenu de l'export
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>{consolidatedEquipments.length} modèles d'équipements</li>
                            <li>{consolidatedEquipments.reduce((total, item) => total + item.quantite, 0)} équipements au total</li>
                            <li>Format CSV avec séparateur ";"</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleExport}
                disabled={!validationResult.isValid || isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exportation en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter en CSV
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Carte historique des exports */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Historique des Exports</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : exports.length === 0 ? (
                <NoExportHistory />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom du fichier</TableHead>
                        <TableHead>Date d'export</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exports.map((exportFile) => (
                        <TableRow key={exportFile.id}>
                          <TableCell className="font-medium">{exportFile.nom}</TableCell>
                          <TableCell>{exportFile.date}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadExport(exportFile)}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-4 w-4" />
                                Télécharger
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteExport(exportFile.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={handleRetry}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recharger la liste des exports
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
