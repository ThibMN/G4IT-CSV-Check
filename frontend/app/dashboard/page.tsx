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

export default function Dashboard() {
  const router = useRouter();

  // Accès aux stores Zustand
  const { setEquipments, setImportedFile } = useEquipmentStore();
  const { setErrors, hasCriticalErrors } = useErrorStore();

  // États locaux
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingFiles, setProcessingFiles] = useState<number[]>([]);
  const [processedFiles, setProcessedFiles] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fonctions de navigation
  const navigateToPage = (path: string) => {
    router.push(path);
  };

  // Fonction pour gérer le changement de fichiers
  const handleFileChange = (files: File[]) => {
    setUploadedFiles(files);
    setImportedFile(files[0] || null); // garde le fiché importé dans le store
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
        <Card>
          <CardHeader>
            <CardTitle>Importation de données</CardTitle>
            <CardDescription>Téléchargez vos fichiers CSV ou XLSX pour commencer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <FileUpload onChange={handleFileChange} />

              {hasTableData && (
                <table className="w-full text-sm mt-6">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Nom</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Statut</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Taille</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date d'ajout</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4">{item.type}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 ${item.status === 'Traité' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} rounded-full text-xs`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{item.size}</td>
                        <td className="py-3 px-4">{item.date}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {processingFiles.includes(item.id) ? (
                              <div className="flex items-center gap-2">
                                <LoaderData />
                                <span className="text-xs text-gray-500">Traitement...</span>
                              </div>
                            ) : processedFiles.includes(item.id) ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs">Traité</span>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleProcessFile(item.id)}
                                className="px-3 py-1 h-8"
                              >
                                Traiter
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(item.id)}
                              className="px-2 py-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>

          {hasTableData && (
            <CardFooter className="flex justify-between">
              {processedFiles.length > 0 && (
                <Button
                  onClick={() => router.push('/mapping')}
                  className="flex items-center gap-2"
                >
                  Continuer vers le mapping <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setUploadedFiles([])}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer tous les fichiers
              </Button>
            </CardFooter>
          )}
        </Card>

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

