"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Save,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Type pour les équipements
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
  selected?: boolean;
};

// Type pour les équipements consolidés
type ConsolidatedEquipment = Omit<Equipment, 'selected'> & {
  originalIds: string[];
};

export default function ConsolidationPage() {
  // États
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [consolidatedEquipments, setConsolidatedEquipments] = useState<ConsolidatedEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [consolidationSuccess, setConsolidationSuccess] = useState(false);
  const router = useRouter();

  // Charger les équipements
  useEffect(() => {
    fetchEquipments();
  }, []);

  // Fonction pour récupérer les équipements
  const fetchEquipments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Utiliser des données de test
      const mockEquipments = getMockEquipments().map(eq => ({ ...eq, selected: false }));
      setEquipments(mockEquipments);
    } catch (err) {
      console.error('Erreur lors du chargement des équipements:', err);
      setError('Impossible de charger les équipements. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour obtenir des données de test
  const getMockEquipments = (): Equipment[] => {
    return Array(50).fill(null).map((_, index) => ({
      id: `eq-${index + 1}`,
      equipmentType: ['Laptop', 'Desktop', 'Server', 'Monitor', 'Printer'][Math.floor(Math.random() * 5)],
      manufacturer: ['Dell', 'HP', 'Lenovo', 'Apple', 'ASUS'][Math.floor(Math.random() * 5)],
      model: `Model-${index % 10 + 1}`, // Créer des modèles qui se répètent
      quantity: Math.floor(Math.random() * 5) + 1,
      cpu: Math.random() > 0.3 ? ['Intel i5', 'Intel i7', 'AMD Ryzen 5', 'AMD Ryzen 7'][Math.floor(Math.random() * 4)] : undefined,
      ram: Math.random() > 0.3 ? ['8GB', '16GB', '32GB'][Math.floor(Math.random() * 3)] : undefined,
      storage: Math.random() > 0.3 ? ['256GB', '512GB', '1TB'][Math.floor(Math.random() * 3)] : undefined,
      purchaseYear: Math.random() > 0.3 ? ['2020', '2021', '2022', '2023'][Math.floor(Math.random() * 4)] : undefined,
      eol: Math.random() > 0.3 ? ['2025', '2026', '2027', '2028'][Math.floor(Math.random() * 4)] : undefined,
    }));
  };

  // Fonction pour gérer la sélection d'un équipement
  const handleEquipmentSelection = (id: string) => {
    // Mettre à jour la liste des équipements
    setEquipments(prevEquipments =>
      prevEquipments.map(eq =>
        eq.id === id ? { ...eq, selected: !eq.selected } : eq
      )
    );

    // Mettre à jour les équipements sélectionnés
    setSelectedEquipments(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(eqId => eqId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  // Fonction pour consolider les équipements sélectionnés
  const consolidateSelectedEquipments = () => {
    // Filtrer les équipements sélectionnés
    const selected = equipments.filter(eq => eq.selected);

    if (selected.length < 2) {
      setError('Vous devez sélectionner au moins 2 équipements pour les consolider.');
      return;
    }

    // Créer l'équipement consolidé
    const firstEquipment = selected[0];
    const consolidatedEquipment: ConsolidatedEquipment = {
      id: `consolidated-${Date.now()}`,
      equipmentType: firstEquipment.equipmentType,
      manufacturer: firstEquipment.manufacturer,
      model: firstEquipment.model,
      quantity: selected.reduce((total, eq) => total + eq.quantity, 0),
      cpu: firstEquipment.cpu,
      ram: firstEquipment.ram,
      storage: firstEquipment.storage,
      purchaseYear: firstEquipment.purchaseYear,
      eol: firstEquipment.eol,
      originalIds: selected.map(eq => eq.id)
    };

    // Ajouter l'équipement consolidé
    setConsolidatedEquipments(prev => [...prev, consolidatedEquipment]);

    // Effacer la sélection
    setSelectedEquipments([]);
    setEquipments(prevEquipments =>
      prevEquipments.map(eq => ({ ...eq, selected: false }))
    );

    // Afficher le tableau des équipements consolidés
    setShowConsolidated(true);
    setConsolidationSuccess(true);

    // Effacer le message de succès après 3 secondes
    setTimeout(() => {
      setConsolidationSuccess(false);
    }, 3000);
  };

  // Fonction pour sauvegarder les équipements consolidés
  const saveConsolidation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Rediriger vers la page d'exportation
      router.push('/export');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des équipements consolidés:', err);
      setError('Impossible de sauvegarder les équipements consolidés. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour filtrer les équipements par type
  const filteredEquipments = filterType
    ? equipments.filter(eq => eq.equipmentType === filterType)
    : equipments;

  // Fonction pour revenir à la page des équipements
  const goBackToEquipments = () => {
    router.push('/equipment');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={goBackToEquipments}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Consolidation des Équipements</h1>
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
              onClick={fetchEquipments}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* Message de succès */}
      {consolidationSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Équipements consolidés avec succès</h3>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 border-b-2 ${!showConsolidated ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
          onClick={() => setShowConsolidated(false)}
        >
          Équipements
        </button>
        <button
          className={`py-2 px-4 border-b-2 ${showConsolidated ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
          onClick={() => setShowConsolidated(true)}
          disabled={consolidatedEquipments.length === 0}
        >
          Équipements Consolidés ({consolidatedEquipments.length})
        </button>
      </div>

      {!showConsolidated ? (
        <div className="space-y-6">
          {/* Filtre par type */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtrer les équipements</CardTitle>
              <CardDescription>Sélectionnez le type d'équipement à afficher</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
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
              </div>
            </CardContent>
          </Card>

          {/* Tableau d'équipements */}
          <Card>
            <CardHeader>
              <CardTitle>Équipements disponibles</CardTitle>
              <CardDescription>Sélectionnez les équipements à consolider</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredEquipments.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  Aucun équipement trouvé.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Fabricant</TableHead>
                        <TableHead>Modèle</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>CPU</TableHead>
                        <TableHead>RAM</TableHead>
                        <TableHead>Stockage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEquipments.map((equipment) => (
                        <TableRow key={equipment.id} className={equipment.selected ? 'bg-blue-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={equipment.selected}
                              onCheckedChange={() => handleEquipmentSelection(equipment.id)}
                            />
                          </TableCell>
                          <TableCell>{equipment.equipmentType}</TableCell>
                          <TableCell>{equipment.manufacturer}</TableCell>
                          <TableCell>{equipment.model}</TableCell>
                          <TableCell>{equipment.quantity}</TableCell>
                          <TableCell>{equipment.cpu || '-'}</TableCell>
                          <TableCell>{equipment.ram || '-'}</TableCell>
                          <TableCell>{equipment.storage || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 p-4 border-t">
              <Button
                onClick={consolidateSelectedEquipments}
                disabled={selectedEquipments.length < 2 || isLoading}
              >
                Consolider {selectedEquipments.length > 0 ? `(${selectedEquipments.length})` : ''}
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tableau des équipements consolidés */}
          <Card>
            <CardHeader>
              <CardTitle>Équipements Consolidés</CardTitle>
              <CardDescription>Résultat de la consolidation des équipements sélectionnés</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {consolidatedEquipments.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  Aucun équipement consolidé pour l'instant.
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consolidatedEquipments.map((equipment) => (
                        <TableRow key={equipment.id}>
                          <TableCell>{equipment.equipmentType}</TableCell>
                          <TableCell>{equipment.manufacturer}</TableCell>
                          <TableCell>{equipment.model}</TableCell>
                          <TableCell>{equipment.quantity}</TableCell>
                          <TableCell>{equipment.cpu || '-'}</TableCell>
                          <TableCell>{equipment.ram || '-'}</TableCell>
                          <TableCell>{equipment.storage || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowConsolidated(false)}
              >
                Retour aux équipements
              </Button>
              <Button
                onClick={saveConsolidation}
                disabled={consolidatedEquipments.length === 0 || isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer et exporter
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
