"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFileStore } from "@/store/file-store";
import { useRouter } from "next/navigation";

type Equipment = {
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
};

export default function EquipmentPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  
  const { currentFile } = useFileStore();
  const router = useRouter();
  
  useEffect(() => {
    if (currentFile) {
      processUploadedFile();
    } else {
      fetchEquipments();
    }
  }, [currentFile]);
  
  useEffect(() => {
    if (allEquipments.length > 0) {
      applyFiltersAndPagination();
    }
  }, [currentPage, searchTerm, filterType, allEquipments]);
  
  const processUploadedFile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!currentFile) {
        setError("Aucun fichier n'est disponible. Veuillez retourner au dashboard pour en charger un.");
        setIsLoading(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('file', currentFile);
      
      const response = await fetch('/api/process-uploaded-file', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      setAllEquipments(data.equipments || []);
      
      applyFiltersAndPagination(data.equipments);
      
    } catch (err: any) {
      console.error("Erreur lors du traitement du fichier:", err);
      setError("Impossible de traiter le fichier. " + (err.message || "Veuillez réessayer."));
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFiltersAndPagination = (data = allEquipments) => {
    let filteredData = [...data];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredData = filteredData.filter(eq =>
        (eq.model && eq.model.toLowerCase().includes(term)) ||
        (eq.manufacturer && eq.manufacturer.toLowerCase().includes(term)) ||
        (eq.equipmentType && eq.equipmentType.toLowerCase().includes(term))
      );
    }
    
    if (filterType) {
      filteredData = filteredData.filter(eq => eq.equipmentType === filterType);
    }
    
    const itemsPerPage = 10;
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    setEquipments(paginatedData);
    setTotalPages(totalPages || 1);
  };

  const fetchEquipments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData = getMockEquipments();

      let filteredData = [...mockData];

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter(eq =>
          eq.model.toLowerCase().includes(term) ||
          eq.manufacturer.toLowerCase().includes(term) ||
          eq.equipmentType.toLowerCase().includes(term)
        );
      }

      if (filterType) {
        filteredData = filteredData.filter(eq => eq.equipmentType === filterType);
      }

      const itemsPerPage = 10;
      const totalItems = filteredData.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
      const paginatedData = filteredData.slice(startIndex, endIndex);

      setEquipments(paginatedData);
      setTotalPages(totalPages || 1);
    } catch (err) {
      console.error("Erreur lors du chargement des équipements:", err);
      setError("Impossible de charger les équipements. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const getMockEquipments = (): Equipment[] => {
    return Array(50).fill(null).map((_, index) => ({
      id: `eq-${index + 1}`,
      equipmentType: ['Laptop', 'Desktop', 'Server', 'Monitor', 'Printer'][Math.floor(Math.random() * 5)],
      manufacturer: ['Dell', 'HP', 'Lenovo', 'Apple', 'ASUS'][Math.floor(Math.random() * 5)],
      model: `Model-${index + 1}`,
      quantity: Math.floor(Math.random() * 10) + 1,
      cpu: Math.random() > 0.3 ? ['Intel i5', 'Intel i7', 'AMD Ryzen 5', 'AMD Ryzen 7'][Math.floor(Math.random() * 4)] : undefined,
      ram: Math.random() > 0.3 ? ['8GB', '16GB', '32GB'][Math.floor(Math.random() * 3)] : undefined,
      storage: Math.random() > 0.3 ? ['256GB', '512GB', '1TB'][Math.floor(Math.random() * 3)] : undefined,
      purchaseYear: Math.random() > 0.3 ? ['2020', '2021', '2022', '2023'][Math.floor(Math.random() * 4)] : undefined,
      eol: Math.random() > 0.3 ? ['2025', '2026', '2027', '2028'][Math.floor(Math.random() * 4)] : undefined,
    }));
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setCurrentPage(1);
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Équipements</h1>

      {!currentFile && !isLoading && (
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-medium">Aucun fichier chargé</h3>
              <p className="text-sm text-gray-500">
                Vous visualisez des données de démonstration. Chargez un fichier pour voir vos propres données.
              </p>
            </div>
            <Button onClick={goToDashboard}>
              <Upload className="h-4 w-4 mr-2" />
              Charger un fichier
            </Button>
          </CardContent>
        </Card>
      )}

      {currentFile && (
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-medium">Fichier chargé: {currentFile.name}</h3>
              <p className="text-sm text-gray-500">
                Vous visualisez les données de votre fichier.
              </p>
            </div>
            <Button variant="outline" onClick={goToDashboard}>
              Changer de fichier
            </Button>
          </CardContent>
        </Card>
      )}

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
                <option value="Laptop">Laptops</option>
                <option value="Desktop">Desktops</option>
                <option value="Server">Serveurs</option>
                <option value="Monitor">Écrans</option>
                <option value="Printer">Imprimantes</option>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Fabricant</TableHead>
                    <TableHead>Modèle</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>RAM</TableHead>
                    <TableHead>Stockage</TableHead>
                    <TableHead>Achat</TableHead>
                    <TableHead>Fin de vie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipments.map((equipment) => (
                    <TableRow key={equipment.id}>
                      <TableCell>{equipment.equipmentType}</TableCell>
                      <TableCell>{equipment.manufacturer}</TableCell>
                      <TableCell>{equipment.model}</TableCell>
                      <TableCell>{equipment.quantity}</TableCell>
                      <TableCell>{equipment.cpu || '-'}</TableCell>
                      <TableCell>{equipment.ram || '-'}</TableCell>
                      <TableCell>{equipment.storage || '-'}</TableCell>
                      <TableCell>{equipment.purchaseYear || '-'}</TableCell>
                      <TableCell>{equipment.eol || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
