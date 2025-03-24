"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, RefreshCw, Edit, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useEquipmentStore, ConsolidatedEquipment, Equipment } from "@/store/equipment-store";
import Navbar from "@/components/layout/navbar";
import { useNotification } from "@/components/ui/notifications";

// Données d'exemple pour la démo
const EXAMPLE_EQUIPMENTS: Equipment[] = [
  { id: 1, nom: "PC Dell 1", modele: "Dell X280", quantite: 2, statut: "Actif" },
  { id: 2, nom: "PC Dell 2", modele: "Dell X280", quantite: 3, statut: "Actif" },
  { id: 3, nom: "Écran HP", modele: "HP Z27", quantite: 1, statut: "Actif" },
  { id: 4, nom: "Serveur 1", modele: "Dell PowerEdge", quantite: 1, statut: "Actif" },
  { id: 5, nom: "Serveur 2", modele: "Dell PowerEdge", quantite: 2, statut: "Inactif" },
  { id: 6, nom: "MacBook Pro 1", modele: "MacBook Pro", quantite: 2, statut: "Actif" },
  { id: 7, nom: "MacBook Pro 2", modele: "MacBook Pro", quantite: 1, statut: "Actif" },
];

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

// État de chargement
const LoadingState = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      <span className="ml-2 text-gray-600">Chargement en cours...</span>
    </div>
  );
};

// Message "Aucun résultat"
const NoResults = () => {
  return (
    <div className="text-center py-10 text-gray-500">
      <p>Aucun équipement à consolider n'a été trouvé.</p>
      <p className="text-sm mt-1">Veuillez d'abord ajouter des équipements ou vérifier vos filtres.</p>
    </div>
  );
};

// Boîte de dialogue pour modifier manuellement un équipement
const EditEquipmentDialog = ({
  isOpen,
  onClose,
  equipment,
  index,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  equipment: ConsolidatedEquipment | null;
  index: number;
  onSave: (index: number, equipment: ConsolidatedEquipment) => void;
}) => {
  const [quantity, setQuantity] = useState<number>(equipment?.quantite || 0);

  useEffect(() => {
    if (equipment) {
      setQuantity(equipment.quantite);
    }
  }, [equipment]);

  const handleSave = () => {
    if (equipment && quantity > 0) {
      onSave(index, {
        ...equipment,
        quantite: quantity
      });
      onClose();
    }
  };

  if (!equipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la quantité</DialogTitle>
          <DialogDescription>
            Ajustez la quantité pour le modèle {equipment.modele}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="quantity" className="text-right text-sm font-medium">
              Quantité
            </label>
            <div className="col-span-3">
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSave} disabled={quantity <= 0}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ConsolidationPage() {
  // États locaux
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState<number>(-1);

  // Accès au store Zustand
  const {
    equipments,
    setEquipments,
    consolidatedEquipments,
    isConsolidationModified,
    error,
    setError,
    consolidateEquipments,
    updateConsolidatedEquipment,
  } = useEquipmentStore();

  // Charger des données d'exemple si aucun équipement n'est disponible
  useEffect(() => {
    if (equipments.length === 0) {
      setEquipments(EXAMPLE_EQUIPMENTS);
    }
  }, [equipments.length, setEquipments]);

  // Effectuer la consolidation initiale des équipements
  useEffect(() => {
    if (equipments.length > 0) {
      consolidateEquipments();
    }
  }, [equipments, consolidateEquipments]);

  // Soumettre les données consolidées à l'API
  const handleSubmitConsolidation = async () => {
    if (consolidatedEquipments.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Dans une application réelle, appel à l'API pour sauvegarder les données
      // await axios.post('http://localhost:3000/consolidation', consolidatedEquipments);

      // Simulation d'un appel API réussi
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccessMessage("Les équipements ont été consolidés avec succès !");

      // En cas de succès, reset le flag de modification
      useEquipmentStore.getState().setIsConsolidationModified(false);
    } catch (err) {
      console.error("Erreur lors de la soumission des données consolidées:", err);
      setError("Impossible de sauvegarder les données consolidées. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ouvrir la boîte de dialogue d'édition
  const handleEditEquipment = (index: number) => {
    setCurrentEditIndex(index);
    setEditDialogOpen(true);
  };

  // Fermer la boîte de dialogue d'édition
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentEditIndex(-1);
  };

  // Enregistrer les modifications d'un équipement
  const notification = useNotification();
  
  // Mettre à jour la fonction handleSaveEquipment pour utiliser les notifications
  const handleSaveEquipment = (index: number, updatedEquipment: ConsolidatedEquipment) => {
    updateConsolidatedEquipment(index, updatedEquipment);
    notification.success("La quantité a été mise à jour avec succès !");
  };

  // Recharger les données en cas d'erreur
  const handleRetry = () => {
    setError(null);
    consolidateEquipments();
  };

  // Si aucun équipement n'est disponible pour la consolidation
  const hasNoEquipments = equipments.length === 0;
  const hasNoConsolidatedEquipments = consolidatedEquipments.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Consolidation des Données</h1>

        {/* Message d'erreur */}
        {error && <ErrorMessage message={error} onRetry={handleRetry} />}

        {/* Message de succès */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Équipements Consolidés</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState />
            ) : hasNoEquipments || hasNoConsolidatedEquipments ? (
              <NoResults />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modèle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidatedEquipments.map((equipment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{equipment.modele}</TableCell>
                        <TableCell>{equipment.type}</TableCell>
                        <TableCell>{equipment.quantite}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEquipment(index)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Modifier
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              {consolidatedEquipments.length > 0 && (
                <>
                  {consolidatedEquipments.length} modèles d'équipements consolidés (
                  {consolidatedEquipments.reduce((total, item) => total + item.quantite, 0)} équipements au total)
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={consolidatedEquipments.length === 0 || isSubmitting}
                onClick={consolidateEquipments}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculer
              </Button>
              <Button
                disabled={consolidatedEquipments.length === 0 || isSubmitting}
                onClick={handleSubmitConsolidation}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider la consolidation
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Boîte de dialogue pour modifier un équipement */}
        <EditEquipmentDialog
          isOpen={editDialogOpen}
          onClose={handleCloseEditDialog}
          equipment={currentEditIndex >= 0 ? consolidatedEquipments[currentEditIndex] : null}
          index={currentEditIndex}
          onSave={handleSaveEquipment}
        />
      </div>
    </div>
  );
}
