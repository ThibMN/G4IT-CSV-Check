"use client";

import { useState, useEffect } from "react";
import { Metadata } from "next";
import {
  BarChart,
  Users,
  Server,
  Activity,
  TrendingUp,
  FileUp,
  Columns,
  Package,
  GitMerge,
  FileDown,
  AlertCircle,
  Trash2,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { LoaderData } from "@/components/ui/loader-data";
import { useEquipmentStore } from "@/store/equipment-store";
import { useErrorStore } from "@/store/error-store";
import { parseFile } from "@/lib/file-parser";
import { processFileData, FileData } from "@/lib/validation-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorDisplay } from '@/components/ui/error-display';
import axios from 'axios';

type ValidationReport = {
  isValid: boolean;
  requiredColumns: string[];
  optionalColumns: string[];
  missingColumns: string[];
  typeErrors: {
    column: string;
    row: number;
    value: string;
    expectedType: string;
  }[];
  detectedColumns: string[];
};

export default function Dashboard() {
  const router = useRouter();

  // Accès aux stores Zustand
  const { setEquipments } = useEquipmentStore();
  const { setErrors, hasCriticalErrors, addErrors, clearErrors } = useErrorStore();

  // États locaux
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingFiles, setProcessingFiles] = useState<number[]>([]);
  const [processedFiles, setProcessedFiles] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);

  // Fonctions de navigation
  const navigateToPage = (path: string) => {
    router.push(path);
  };

  // Fonction pour gérer le changement de fichiers
  const handleFileChange = (files: File[]) => {
    // Remplacer complètement les fichiers au lieu de les ajouter
    setUploadedFiles(files);
    // Réinitialiser les états
    setProcessingFiles([]);
    setProcessedFiles([]);
    setErrorMessage(null);
  };

  // Fonction pour traiter un fichier
  const handleProcessFile = async (fileId: number) => {
    const fileIndex = fileId - 1;
    const file = uploadedFiles[fileIndex];

    if (!file) return;

    setProcessingFiles(prev => [...prev, fileId]);
    setErrorMessage(null);

    try {
      // Analyser le fichier
      const parseResult = await parseFile(file);

      if (parseResult.error) {
        setErrorMessage(parseResult.error);
        setProcessingFiles(prev => prev.filter(id => id !== fileId));
        return;
      }

      // Vérifier les données et détecter les erreurs
      const { errors, processedData, canExport } = processFileData(parseResult.data);

      // Mettre à jour le store avec les données traitées
      setEquipments(processedData as any[]);

      // Ajouter à la liste des fichiers traités
      setProcessingFiles(prev => prev.filter(id => id !== fileId));
      setProcessedFiles(prev => [...prev, fileId]);

      // Si des erreurs sont détectées
      if (errors.length > 0) {
        setErrors(errors);

        // Si erreurs critiques, rediriger vers la page de gestion des erreurs
        if (!canExport) {
          setTimeout(() => {
            router.push('/error-management');
          }, 1000);
          return;
        }
      }

    } catch (err: any) {
      setErrorMessage(`Erreur lors du traitement du fichier : ${err.message || 'Erreur inconnue'}`);
      setProcessingFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  // Fonction pour supprimer un fichier
  const handleDeleteFile = (fileId: number) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, index) => index !== fileId - 1));
    setProcessingFiles(prev => prev.filter(id => id !== fileId));
    setProcessedFiles(prev => prev.filter(id => id !== fileId));
  };

  // Données pour le tableau
  const tableData = uploadedFiles.map((file, index) => ({
    id: index + 1,
    name: file.name,
    type: file.type.split('/')[1] || "Fichier",
    status: processedFiles.includes(index + 1) ? "Traité" : "En attente",
    size: (file.size / 1024).toFixed(0) + " KB",
    date: new Date(file.lastModified).toLocaleDateString('fr-FR')
  }));

  // Vérifier si le tableau a des données
  const hasTableData = tableData.length > 0;

  const handleFilesChanged = async (files: File[]) => {
    try {
      // Réinitialiser les erreurs et l'état
      clearErrors();
      setValidationReport(null);

      if (files.length === 0) {
        return;
      }

      const file = files[0]; // On prend le premier fichier

      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', file);

      try {
        // Envoyer le fichier au backend pour validation
        const response = await axios.post('/api/validate-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('Réponse backend:', response.data);

        // Transformer la réponse pour correspondre au format attendu
        const report: ValidationReport = {
          isValid: response.data.is_valid || false,
          requiredColumns: response.data.required_columns || [],
          optionalColumns: response.data.optional_columns || [],
          missingColumns: response.data.missing_required_columns || [],
          typeErrors: Array.isArray(response.data.type_errors)
            ? response.data.type_errors.map((error: any) => ({
                column: error.column || '',
                row: error.row || 0,
                value: error.value || '',
                expectedType: error.expected_type || 'valide'
              }))
            : [],
          detectedColumns: response.data.detected_columns || []
        };

        setValidationReport(report);

        if (!report.isValid) {
          // Transformer les erreurs pour les ajouter au store
          const errors = [];

          // Colonnes manquantes
          if (report.missingColumns && report.missingColumns.length > 0) {
            report.missingColumns.forEach(column => {
              errors.push({
                type: 'missing_column' as const,
                severity: 'critical' as const,
                column,
                message: `Colonne requise "${column}" manquante dans le fichier CSV.`,
                suggestions: [
                  `Ajoutez une colonne nommée "${column}" dans votre fichier CSV.`,
                  `Vérifiez les en-têtes de colonnes pour les fautes de frappe.`
                ]
              });
            });
          }

          // Erreurs de type
          if (report.typeErrors && report.typeErrors.length > 0) {
            report.typeErrors.forEach(error => {
              errors.push({
                type: 'invalid_format' as const,
                severity: 'warning' as const,
                column: error.column,
                row: error.row,
                value: error.value,
                message: `Format invalide à la ligne ${error.row}. La valeur "${error.value}" n'est pas de type ${error.expectedType}.`,
                suggestions: [
                  `Corrigez la valeur en respectant le format ${error.expectedType}.`,
                  `Vérifiez si des caractères spéciaux ou espaces supplémentaires sont présents.`
                ]
              });
            });
          }

          // Ajouter les erreurs au store
          if (errors.length > 0) {
            addErrors(errors);
          }
        }
      } catch (apiError: any) {
        console.error("Erreur API:", apiError);
        // Afficher une erreur spécifique pour les problèmes de connexion au backend
        const errorMsg = apiError.response?.data?.error ||
                         "Impossible de se connecter au serveur de validation. Veuillez vérifier que le backend est en cours d'exécution.";

        addErrors([{
          type: 'connection_error',
          severity: 'critical',
          column: '',
          message: errorMsg,
          suggestions: [
            "Vérifiez que le serveur backend est démarré.",
            "Vérifiez votre connexion réseau.",
            "Essayez de rafraîchir la page."
          ]
        }]);
      }
    } catch (err) {
      console.error("Erreur générale lors de la validation:", err);
    }
  };

  const handleContinueToMapping = () => {
    if (validationReport?.isValid) {
      router.push('/mapping');
    }
  };

  const handleRetry = () => {
    // Réinitialiser les erreurs et le rapport de validation
    clearErrors();
    setValidationReport(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col gap-5 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* En-tête du dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-600 mt-1">Importez et gérez vos équipements numériques</p>
          </div>
        </div>

        {/* Messages d'erreur */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Cartes de workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigateToPage('/dashboard')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Importation</CardTitle>
              <FileUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Importez vos données d'équipements</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigateToPage('/mapping')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mapping des colonnes</CardTitle>
              <Columns className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Associez vos colonnes aux champs requis</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigateToPage('/equipments')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gestion des équipements</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Consultez et modifiez vos équipements</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigateToPage('/export')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Exportation</CardTitle>
              <FileDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Exportez vos données consolidées</p>
            </CardContent>
          </Card>
        </div>

        {/* Import de fichiers */}
        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upload">Import de fichier</TabsTrigger>
            <TabsTrigger value="recent">Fichiers récents</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Importer un fichier CSV</CardTitle>
                    <CardDescription>
                      Sélectionnez un fichier CSV contenant vos données d'équipements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload onChange={handleFilesChanged} />

                    {validationReport && (
                      <div className="mt-6">
                        {validationReport.isValid ? (
                          <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <p className="text-green-800 font-medium">Fichier valide !</p>
                            <p className="text-green-600 text-sm mt-1">
                              Votre fichier contient toutes les colonnes requises et est prêt pour l'étape suivante.
                            </p>
                            <Button
                              className="mt-3"
                              onClick={handleContinueToMapping}
                            >
                              Continuer vers le mapping
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-red-800 font-medium">Fichier invalide</p>
                            <p className="text-red-600 text-sm mt-1">
                              Votre fichier contient des erreurs qui doivent être corrigées avant de continuer.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <ErrorDisplay onRetry={handleRetry} />
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Format du fichier</CardTitle>
                    <CardDescription>
                      Votre fichier CSV doit respecter le format suivant
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-sm mb-1">En-têtes requis:</h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <code className="text-xs text-gray-800 whitespace-pre-wrap">
                            nomEquipementPhysique, modele, quantite, nomCourtDatacenter, type, statut, paysDUtilisation
                          </code>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm mb-1">En-têtes optionnels:</h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <code className="text-xs text-gray-800 whitespace-pre-wrap">
                            dateAchat, dateRetrait, dureeUsageInterne, dureeUsageAmont, dureeUsageAval, consoElecAnnuelle, utilisateur, nomSourceDonnee, nomEntite, nbCoeur, nbJourUtiliseAn, goTelecharge, modeUtilisation, tauxUtilisation, qualite
                          </code>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Fichiers récents</CardTitle>
                <CardDescription>
                  Accédez à vos fichiers récemment importés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Aucun fichier récent disponible</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Liens rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Consolidation</CardTitle>
              <CardDescription>Regroupez vos équipements similaires</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">
                Regroupez automatiquement vos équipements par modèle et calculez les totaux.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigateToPage('/consolidation')}
              >
                <GitMerge className="h-4 w-4 mr-2" />
                Accéder à la consolidation
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Erreurs détectées</CardTitle>
              <CardDescription>Gérez les problèmes dans vos données</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">
                Visualisez et corrigez les erreurs détectées dans vos fichiers importés.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigateToPage('/error-management')}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Gérer les erreurs
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportation</CardTitle>
              <CardDescription>Exportez vos données au format CSV</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">
                Exportez vos données traitées et consolidées pour les utiliser dans d'autres applications.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigateToPage('/export')}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exporter les données
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

