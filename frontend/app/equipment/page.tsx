"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFileStore } from "@/store/file-store";
import { parseFile } from "@/lib/file-parser"; // Assurez-vous que vous avez cette fonction

type Equipment = {
  id?: string;
  nomEquipementPhysique: string;
  modele: string;
  quantite: number;
  nomCourtDatacenter: string;
  type: string;
  statut: string;
  paysDUtilisation: string;
  dateAchat?: string;
  dateRetrait?: string;
  dureeUsageInterne?: string;
  dureeUsageAmont?: string;
  dureeUsageAval?: string;
  consoElecAnnuelle?: string;
  utilisateur?: string;
  nomSourceDonnee?: string;
  nomEntite?: string;
  nbCoeur?: number;
  nbJourUtiliseAn?: number;
  goTelecharge?: number;
  modeUtilisation?: string;
  tauxUtilisation?: string;
  qualite?: string;
  [key: string]: any; // Pour permettre l'accès dynamique aux propriétés
};

export default function EquipmentPage() {
  // États pour les données et les filtres
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  
  // Récupérer le fichier et les colonnes détectées du store
  const { currentFile, detectedColumns } = useFileStore();
  
  // Charger les données du fichier au montage du composant
  useEffect(() => {
    if (currentFile) {
      loadFileData(currentFile);
    } else {
      // Si pas de fichier, charger des données de test
      fetchEquipments();
    }
  }, [currentFile]);

  // Effet pour appliquer les filtres quand ils changent
  useEffect(() => {
    if (allEquipments.length > 0) {
      applyFiltersAndPagination(allEquipments);
    }
  }, [currentPage, searchTerm, filterType]);

  // Fonction pour charger les données du fichier
  const loadFileData = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      // Analyser le fichier CSV chargé
      const result = await parseFile(file);
      
      if (result.error) {
        setError(`Erreur lors de l'analyse du fichier: ${result.error}`);
        setIsLoading(false);
        return;
      }
      
      // Convertir les données CSV en objets Equipment
      const data = result.data as Equipment[];
      
      setAllEquipments(data);
      applyFiltersAndPagination(data);
    } catch (err) {
      console.error("Erreur lors du chargement du fichier:", err);
      setError("Impossible de charger les données du fichier.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour récupérer les équipements (données de test)
  const fetchEquipments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simuler un appel API avec des données de test
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Données de test
      const mockData = getMockEquipments();
      setAllEquipments(mockData); // Stocker toutes les données

      // Appliquer les filtres et la pagination
      applyFiltersAndPagination(mockData);
    } catch (err) {
      console.error("Erreur lors du chargement des équipements:", err);
      setError("Impossible de charger les équipements. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour obtenir des données de test
  const getMockEquipments = (): Equipment[] => {
    return Array(50).fill(null).map((_, index) => ({
      id: `eq-${index + 1}`,
      nomEquipementPhysique: `Équipement ${index + 1}`,
      modele: `Modèle-${index + 1}`,
      quantite: Math.floor(Math.random() * 10) + 1,
      nomCourtDatacenter: ['DC-Paris', 'DC-Lyon', 'DC-Marseille', 'DC-Lille', 'DC-Bordeaux'][Math.floor(Math.random() * 5)],
      type: ['PC Portable', 'PC Fixe', 'Serveur', 'Ecran', 'Réseau', 'Stockage', 'Smartphone'][Math.floor(Math.random() * 7)],
      statut: ['Actif', 'En panne', 'En maintenance', 'Retiré'][Math.floor(Math.random() * 4)],
      paysDUtilisation: ['France', 'Allemagne', 'Espagne', 'Italie', 'Royaume-Uni'][Math.floor(Math.random() * 5)],
      dateAchat: Math.random() > 0.3 ? ['2020', '2021', '2022', '2023'][Math.floor(Math.random() * 4)] : undefined,
      dateRetrait: Math.random() > 0.3 ? ['2025', '2026', '2027', '2028'][Math.floor(Math.random() * 4)] : undefined,
      nbCoeur: Math.random() > 0.3 ? [4, 8, 16, 32, 64][Math.floor(Math.random() * 5)] : undefined,
      tauxUtilisation: Math.random() > 0.3 ? ['25%', '50%', '75%', '90%'][Math.floor(Math.random() * 4)] : undefined,
      consoElecAnnuelle: Math.random() > 0.3 ? ['120kWh', '240kWh', '480kWh', '960kWh'][Math.floor(Math.random() * 4)] : undefined
    }));
  };

  // Fonction pour changer de page
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Fonction pour rechercher
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Réinitialiser à la première page
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setCurrentPage(1);
  };

  // Correction de la fonction applyFiltersAndPagination
  const applyFiltersAndPagination = (data: Equipment[]) => {
    // Filtrer les données
    let filteredData = [...data];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredData = filteredData.filter(eq => {
        // Rechercher dans toutes les colonnes textuelles
        return Object.entries(eq).some(([key, value]) => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(term);
          }
          return false;
        });
      });
    }

    if (filterType) {
      filteredData = filteredData.filter(eq => eq.type === filterType);
    }

    // Déterminer les colonnes disponibles
    if (filteredData.length > 0) {
      const firstItem = filteredData[0];
      // Utiliser les colonnes détectées du store si disponibles, sinon extraire des données
      const columns = detectedColumns.length > 0 
        ? detectedColumns 
        : Object.keys(firstItem).filter(key => key !== 'id');
      
      setAvailableColumns(columns);
    } else {
      setAvailableColumns([]); // Réinitialiser si aucun résultat
    }

    // Pagination
    const itemsPerPage = 10;
    const totalItems = filteredData.length;
    const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    setEquipments(paginatedData);
    setTotalPages(calculatedTotalPages || 1);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Équipements</h1>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="font-medium text-red-800">{error}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEquipments}
            className="mt-2"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Filtres */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtrer les équipements</CardTitle>
          <CardDescription>Utilisez les options ci-dessous pour trouver des équipements spécifiques</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </form>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Tous les types</option>
                <option value="PC Portable">PC Portables</option>
                <option value="PC Fixe">PC Fixes</option>
                <option value="Serveur">Serveurs</option>
                <option value="Ecran">Écrans</option>
                <option value="Réseau">Équipements réseau</option>
                <option value="Stockage">Stockage</option>
                <option value="Smartphone">Smartphones</option>
              </select>

              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau d'équipements */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des équipements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : equipments.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              Aucun équipement trouvé.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Afficher dynamiquement les en-têtes de colonnes basées sur les colonnes disponibles */}
                    {availableColumns.map(column => {
                      // Conversion en noms plus conviviaux pour l'affichage
                      const displayNames: {[key: string]: string} = {
                        nomEquipementPhysique: "Nom équipement",
                        modele: "Modèle",
                        quantite: "Quantité",
                        nomCourtDatacenter: "Datacenter",
                        type: "Type",
                        statut: "Statut",
                        paysDUtilisation: "Pays",
                        dateAchat: "Date d'achat",
                        dateRetrait: "Date de retrait",
                        dureeUsageInterne: "Durée usage interne",
                        dureeUsageAmont: "Durée usage amont",
                        dureeUsageAval: "Durée usage aval",
                        consoElecAnnuelle: "Conso. électrique",
                        utilisateur: "Utilisateur",
                        nomSourceDonnee: "Source de données",
                        nomEntite: "Entité",
                        nbCoeur: "Nb cœurs",
                        nbJourUtiliseAn: "Jours d'utilisation/an",
                        goTelecharge: "Go téléchargés",
                        modeUtilisation: "Mode d'utilisation",
                        tauxUtilisation: "Taux utilisation",
                        qualite: "Qualité"
                      };
                      
                      return (
                        <TableHead key={column}>{displayNames[column] || column}</TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipments.map((equipment, index) => (
                    <TableRow key={equipment.id || index}>
                      {/* Afficher dynamiquement les cellules basées sur les colonnes disponibles */}
                      {availableColumns.map(column => (
                        <TableCell key={column}>
                          {equipment[column] !== undefined ? equipment[column] : '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
