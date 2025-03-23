"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEquipmentStore, EquipmentType, EquipmentModel, Equipment } from "@/store/equipment-store";
import Navbar from "@/components/layout/navbar";

// Pagination des résultats
const Pagination = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-500">
        Page {currentPage} sur {totalPages}
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Suivant
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
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
      <p>Aucun équipement trouvé avec les critères sélectionnés.</p>
      <p className="text-sm mt-1">Veuillez modifier vos filtres ou sélectionner un autre type d'équipement.</p>
    </div>
  );
};

export default function EquipmentManagement() {
  // État local pour les sélecteurs
  const [isTypesLoading, setIsTypesLoading] = useState(false);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [isEquipmentsLoading, setIsEquipmentsLoading] = useState(false);

  // Accès au store Zustand
  const {
    selectedType, setSelectedType,
    selectedModel, setSelectedModel,
    equipmentTypes, setEquipmentTypes,
    equipmentModels, setEquipmentModels,
    equipments, setEquipments,
    currentPage, setCurrentPage,
    totalPages, setTotalPages,
    itemsPerPage,
    error, setError,
  } = useEquipmentStore();

  // Récupération des types d'équipement
  const fetchEquipmentTypes = async () => {
    setIsTypesLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/referentiel/typesEquipement');
      setEquipmentTypes(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des types d'équipement:", err);
      setError("Impossible de charger les types d'équipement. Veuillez réessayer.");
    } finally {
      setIsTypesLoading(false);
    }
  };

  // Récupération des modèles en fonction du type
  const fetchEquipmentModels = async (typeId: number) => {
    if (!typeId) return;

    setIsModelsLoading(true);
    setError(null);
    try {
      // Dans une application réelle, l'URL serait adaptée pour inclure le typeId
      const response = await axios.get('http://localhost:3000/referentiel/facteursCaracterisation', {
        params: {
          critere: 'Climate change',
          etapeacv: 'FABRICATION',
          typeId // Ce paramètre serait utilisé dans une API réelle
        }
      });

      // Filtrer les modèles par type sélectionné (dans un cas réel, l'API ferait ce filtrage)
      const filteredModels = response.data.filter((model: any) =>
        model.type === selectedType?.nom
      );

      setEquipmentModels(filteredModels);
    } catch (err) {
      console.error("Erreur lors du chargement des modèles d'équipement:", err);
      setError("Impossible de charger les modèles d'équipement. Veuillez réessayer.");
      setEquipmentModels([]);
    } finally {
      setIsModelsLoading(false);
    }
  };

  // Récupération des équipements selon les filtres
  const fetchEquipments = async () => {
    setIsEquipmentsLoading(true);
    setError(null);

    try {
      // Dans une application réelle, cette URL et ces paramètres seraient adaptés
      const response = await axios.get('http://localhost:3000/equipements', {
        params: {
          typeId: selectedType?.id,
          modelId: selectedModel?.id,
          page: currentPage,
          limit: itemsPerPage
        }
      });

      // Dans un cas réel, l'API renverrait ces informations
      setEquipments(response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error("Erreur lors du chargement des équipements:", err);
      setError("Impossible de charger la liste des équipements. Veuillez réessayer.");
      setEquipments([]);
    } finally {
      setIsEquipmentsLoading(false);
    }
  };

  // Charger les types d'équipement au montage du composant
  useEffect(() => {
    fetchEquipmentTypes();
  }, []);

  // Charger les modèles quand le type change
  useEffect(() => {
    if (selectedType) {
      fetchEquipmentModels(selectedType.id);
      setCurrentPage(1); // Réinitialiser la pagination
    } else {
      setEquipmentModels([]);
    }
  }, [selectedType]);

  // Charger les équipements quand les filtres ou la page changent
  useEffect(() => {
    if (selectedType) {
      fetchEquipments();
    }
  }, [selectedType, selectedModel, currentPage]);

  // Gestionnaires d'événements
  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const typeId = parseInt(event.target.value);
    if (typeId) {
      const selectedType = equipmentTypes.find(type => type.id === typeId) || null;
      setSelectedType(selectedType);
    } else {
      setSelectedType(null);
    }
    setSelectedModel(null);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = parseInt(event.target.value);
    if (modelId) {
      const selectedModel = equipmentModels.find(model => model.id === modelId) || null;
      setSelectedModel(selectedModel);
    } else {
      setSelectedModel(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Données mockées pour l'exemple
  const mockData = () => {
    // Simuler les types d'équipement
    const types: EquipmentType[] = [
      { id: 1, nom: "Écran" },
      { id: 2, nom: "Ordinateur Portable" },
      { id: 3, nom: "Serveur" }
    ];
    setEquipmentTypes(types);

    // Simuler les modèles selon le type sélectionné
    if (selectedType) {
      let models: EquipmentModel[] = [];
      if (selectedType.id === 1) {
        models = [
          { id: 101, nom: "Dell P2720DC", type: "Écran" },
          { id: 102, nom: "HP Z27", type: "Écran" }
        ];
      } else if (selectedType.id === 2) {
        models = [
          { id: 201, nom: "MacBook Pro", type: "Ordinateur Portable" },
          { id: 202, nom: "Dell XPS 13", type: "Ordinateur Portable" }
        ];
      } else if (selectedType.id === 3) {
        models = [
          { id: 301, nom: "Dell PowerEdge", type: "Serveur" },
          { id: 302, nom: "HP ProLiant", type: "Serveur" }
        ];
      }
      setEquipmentModels(models);
    }

    // Simuler les équipements
    const equipments: Equipment[] = [];
    for (let i = 1; i <= 15; i++) {
      equipments.push({
        id: i,
        nom: `Équipement ${i}`,
        modele: selectedModel ? selectedModel.nom : "Modèle Standard",
        quantite: Math.floor(Math.random() * 10) + 1,
        statut: Math.random() > 0.3 ? "Actif" : "Inactif"
      });
    }

    // Ne prendre que les éléments de la page courante
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setEquipments(equipments.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(equipments.length / itemsPerPage));
  };

  // Utiliser les données mockées au lieu des appels API
  useEffect(() => {
    mockData();
  }, [selectedType, selectedModel, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Gestion des Équipements</h1>

        {error && <ErrorMessage message={error} onRetry={fetchEquipmentTypes} />}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sélecteur de type d'équipement */}
              <div>
                <label htmlFor="equipment-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'équipement
                </label>
                <div className="relative">
                  <select
                    id="equipment-type"
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    value={selectedType?.id || ""}
                    onChange={handleTypeChange}
                    disabled={isTypesLoading}
                  >
                    <option value="">Sélectionner un type</option>
                    {equipmentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.nom}
                      </option>
                    ))}
                  </select>
                  {isTypesLoading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Sélecteur de modèle */}
              <div>
                <label htmlFor="equipment-model" className="block text-sm font-medium text-gray-700 mb-1">
                  Modèle
                </label>
                <div className="relative">
                  <select
                    id="equipment-model"
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    value={selectedModel?.id || ""}
                    onChange={handleModelChange}
                    disabled={!selectedType || isModelsLoading}
                  >
                    <option value="">Tous les modèles</option>
                    {equipmentModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.nom}
                      </option>
                    ))}
                  </select>
                  {isModelsLoading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Équipements</CardTitle>
          </CardHeader>
          <CardContent>
            {isEquipmentsLoading ? (
              <LoadingState />
            ) : equipments.length === 0 ? (
              <NoResults />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Modèle</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipments.map((equipment) => (
                        <TableRow key={equipment.id}>
                          <TableCell className="font-medium">{equipment.nom}</TableCell>
                          <TableCell>{equipment.modele}</TableCell>
                          <TableCell>{equipment.quantite}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                equipment.statut === "Actif"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {equipment.statut}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
