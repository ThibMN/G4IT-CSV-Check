"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, FileUp, Loader2 } from "lucide-react";
import { useEquipmentStore } from "@/store/equipment-store";
import { exportData, downloadExportedFile } from "@/services/api";
import { useNotification } from "@/components/ui/notifications";

export default function ExportPage() {
  const router = useRouter();
  const { consolidatedEquipments } = useEquipmentStore();
  const notification = useNotification();
  
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  
  // Récupérer le chemin du fichier depuis localStorage
  const filePath = typeof window !== 'undefined' ? localStorage.getItem('tempFilePath') : null;
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Déterminer si on exporte depuis le fichier ou depuis les données consolidées
      const exportOptions = {
        format: exportFormat,
        ...(filePath ? { file_path: filePath } : {}),
        ...(consolidatedEquipments.length > 0 ? { equipments: consolidatedEquipments } : {})
      };
      
      // Appeler l'API d'exportation
      const result = await exportData(exportOptions);
      
      if (result.success) {
        // Afficher une notification de succès
        notification.success("Exportation réussie ! Le téléchargement devrait démarrer automatiquement.");
        
        // Télécharger automatiquement le fichier
        downloadExportedFile(result.filename);
      } else {
        notification.error(result.message || "Une erreur est survenue lors de l'exportation");
      }
    } catch (error: any) {
      console.error("Erreur lors de l'exportation:", error);
      notification.error(error.message || "Une erreur est survenue lors de l'exportation");
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Exportation des données</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Exporter vos données</CardTitle>
          <CardDescription>
            Exportez vos données traitées dans le format de votre choix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="csv" onValueChange={(value) => setExportFormat(value as 'csv' | 'xlsx')}>
            <TabsList className="mb-4">
              <TabsTrigger value="csv">CSV</TabsTrigger>
              <TabsTrigger value="xlsx">Excel</TabsTrigger>
            </TabsList>
            <TabsContent value="csv">
              <p className="text-sm text-gray-600 mb-4">
                Le format CSV (Comma-Separated Values) est un format texte simple qui peut être ouvert dans Excel ou tout autre tableur.
              </p>
            </TabsContent>
            <TabsContent value="xlsx">
              <p className="text-sm text-gray-600 mb-4">
                Le format Excel (XLSX) permet de conserver la mise en forme et est directement compatible avec Microsoft Excel.
              </p>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="text-sm text-gray-600">
                {consolidatedEquipments.length > 0 
                  ? `${consolidatedEquipments.length} équipements prêts à être exportés` 
                  : "Aucun équipement à exporter"}
              </p>
            </div>
            <Button 
              onClick={handleExport}
              disabled={isExporting || (!filePath && consolidatedEquipments.length === 0)}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exportation en cours...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Exporter en {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          onClick={() => router.push('/consolidation')}
          className="flex items-center gap-2"
        >
          Retour à la consolidation
        </Button>
        <Button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          Terminer
        </Button>
      </div>
    </div>
  );
}
