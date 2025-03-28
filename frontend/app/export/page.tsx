"use client";

import { useState, useEffect } from "react";
import { Download, AlertCircle, RefreshCw, FileText, Loader2, ArrowLeft, Check, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import axios from 'axios';
import { useProcessedDataStore } from "@/store/processed-data-store";

// Type pour les équipements consolidés
type ConsolidatedEquipment = {
  id: string;
  equipmentType: string;
  manufacturer: string;
  model: string;
  quantity: number;
  cpu?: string;
  ram?: string;
  storage?: string;
  purchaseYear?: string;
  eol?: string;
  originalIds: string[];
};

// Type pour l'historique d'export
type ExportHistory = {
  id: string;
  filename: string;
  dateExported: string;
  format: 'csv' | 'xlsx';
  equipmentCount: number;
};

export default function ExportPage() {
  // États
  const [consolidatedEquipments, setConsolidatedEquipments] = useState<ConsolidatedEquipment[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const router = useRouter();
  
  // Récupérer les données traitées du store
  const { processedData } = useProcessedDataStore();

  // Charger les équipements consolidés
  useEffect(() => {
    if (processedData.length > 0) {
      // Convertir les données traitées au format attendu par l'interface
      const convertedEquipments = processedData.map((item, index) => {
        // Créer un objet ConsolidatedEquipment à partir des données traitées
        const consolidatedItem: ConsolidatedEquipment = {
          id: `processed-${index}`,
          equipmentType: item.type || 'Non spécifié',
          manufacturer: item.fabricant || 'Non spécifié',
          model: item.modele || 'Non spécifié',
          quantity: parseInt(item.quantite) || 1,
          originalIds: [item.nomEquipementPhysique || `item-${index}`]
        };
        
        // Ajouter les champs optionnels s'ils existent
        if (item.nbCoeur) consolidatedItem.cpu = item.nbCoeur.toString();
        if (item.ram) consolidatedItem.ram = item.ram;
        if (item.stockage) consolidatedItem.storage = item.stockage;
        if (item.dateAchat) consolidatedItem.purchaseYear = item.dateAchat;
        if (item.dateRetrait) consolidatedItem.eol = item.dateRetrait;
        
        return consolidatedItem;
      });
      
      setConsolidatedEquipments(convertedEquipments);
      setIsLoading(false);
    } else {
      // Si pas de données traitées, charger les données de test
      fetchConsolidatedEquipments();
    }
  }, [processedData]);

  // Fonction pour récupérer les équipements consolidés
  const fetchConsolidatedEquipments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simuler un appel API avec des données de test
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConsolidatedEquipments(getMockConsolidatedEquipments());
      setExportHistory(getMockExportHistory());
    } catch (err) {
      console.error('Erreur lors du chargement des équipements consolidés:', err);
      setError('Impossible de charger les équipements consolidés. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour obtenir des données de test
  const getMockConsolidatedEquipments = (): ConsolidatedEquipment[] => {
    return [
      {
        id: 'consolidated-1',
        equipmentType: 'Laptop',
        manufacturer: 'Dell',
        model: 'XPS 13',
        quantity: 5,
        cpu: 'Intel i7',
        ram: '16GB',
        storage: '512GB',
        purchaseYear: '2022',
        eol: '2027',
        originalIds: ['eq-1', 'eq-2', 'eq-3']
      },
      {
        id: 'consolidated-2',
        equipmentType: 'Desktop',
        manufacturer: 'HP',
        model: 'EliteDesk',
        quantity: 3,
        cpu: 'Intel i5',
        ram: '8GB',
        storage: '1TB',
        purchaseYear: '2021',
        eol: '2026',
        originalIds: ['eq-4', 'eq-5']
      }
    ];
  };

  // Fonction pour obtenir un historique d'export de test
  const getMockExportHistory = (): ExportHistory[] => {
    return [
      {
        id: 'exp-1',
        filename: 'export-20230601.csv',
        dateExported: '2023-06-01T10:30:00Z',
        format: 'csv',
        equipmentCount: 8
      },
      {
        id: 'exp-2',
        filename: 'export-20230715.xlsx',
        dateExported: '2023-07-15T14:45:00Z',
        format: 'xlsx',
        equipmentCount: 12
      }
    ];
  };

  // Fonction pour exporter les équipements consolidés
  const exportEquipments = async (format: 'csv' | 'xlsx') => {
    try {
      setIsExporting(true);
      setError(null);
      setExportSuccess(null);

      // Appeler l'API backend pour exporter les équipements
      const response = await axios.post(
        'http://localhost:8001/api/export',
        {
          format,
          equipments: consolidatedEquipments
        },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Extraire le nom de fichier de l'en-tête Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="?([^"]*)"?/);
      const filename = filenameMatch ? filenameMatch[1] : `export-${new Date().toISOString().slice(0, 10)}-${format}`;

      // Extraire l'ID d'export de l'en-tête personnalisé
      const exportId = response.headers['x-export-id'] || `exp-${Date.now()}`;

      // Créer un URL pour le blob et déclencher le téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Mettre à jour l'historique d'export avec le fichier réel
      const newExport: ExportHistory = {
        id: exportId,
        filename: filename,
        dateExported: new Date().toISOString(),
        format,
        equipmentCount: consolidatedEquipments.reduce((sum, eq) => sum + eq.quantity, 0)
      };

      setExportHistory([newExport, ...exportHistory]);
      setExportSuccess(`Fichier ${format.toUpperCase()} exporté avec succès !`);

      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setExportSuccess(null);
      }, 5000);
    } catch (err) {
      console.error(`Erreur lors de l'exportation des équipements en ${format}:`, err);
      setError(`Impossible d'exporter les équipements en ${format.toUpperCase()}. Veuillez réessayer.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction pour télécharger un export de l'historique
  const downloadExportFromHistory = async (exportItem: ExportHistory) => {
    try {
      setIsLoading(true);
      
      // Appeler l'API backend pour télécharger le fichier
      const response = await axios.get(`http://localhost:8001/api/download-file/${exportItem.filename}`, {
        responseType: 'blob', // Important pour recevoir des données binaires
      });
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Créer un élément <a> temporaire pour déclencher le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', exportItem.filename);
      
      // Ajouter au DOM, cliquer, puis nettoyer
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Libérer l'URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      setError(`Impossible de télécharger le fichier ${exportItem.filename}. Veuillez réessayer.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour revenir à la page de consolidation
  const goBackToConsolidation = () => {
    router.push('/consolidation');
  };

  // Fonction pour réessayer en cas d'erreur
  const handleRetry = () => {
    fetchConsolidatedEquipments();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={goBackToConsolidation}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Exportation des Données</h1>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">{error}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* Message de succès */}
      {exportSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 flex items-start gap-3">
          <Check className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">{exportSuccess}</h3>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Carte pour l'export */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exporter les équipements consolidés</CardTitle>
              <CardDescription>
                Choisissez le format d'export souhaité
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : consolidatedEquipments.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  Aucun équipement consolidé à exporter.
                  <div className="mt-4">
                    <Button onClick={() => router.push('/consolidation')}>
                      Aller à la page de consolidation
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-md">
                    <h3 className="font-medium text-blue-800 mb-2">
                      Résumé des équipements 
                      {processedData.length > 0 ? ' (Fichier importé)' : ' (Données de test)'}
                    </h3>
                    <ul className="space-y-1 text-sm">
                      <li>Nombre total d'équipements : {consolidatedEquipments.reduce((sum, eq) => sum + eq.quantity, 0)}</li>
                      <li>Nombre de types d'équipements : {new Set(consolidatedEquipments.map(eq => eq.equipmentType)).size}</li>
                      <li>Fabricants représentés : {Array.from(new Set(consolidatedEquipments.map(eq => eq.manufacturer))).join(', ')}</li>
                    </ul>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      onClick={() => exportEquipments('csv')}
                      disabled={isExporting}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Exporter en CSV
                    </Button>
                    <Button
                      onClick={() => exportEquipments('xlsx')}
                      disabled={isExporting}
                      className="flex-1"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Exporter en Excel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Carte pour l'historique des exports */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Historique des exports</CardTitle>
              <CardDescription>
                Téléchargez à nouveau des exports précédents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : exportHistory.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  Aucun historique d'export disponible
                </div>
              ) : (
                <ul className="space-y-3">
                  {exportHistory.map(exportItem => (
                    <li
                      key={exportItem.id}
                      className="border rounded-md p-3 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">{exportItem.filename}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(exportItem.dateExported).toLocaleDateString()} - {exportItem.equipmentCount} équipements
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadExportFromHistory(exportItem)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
