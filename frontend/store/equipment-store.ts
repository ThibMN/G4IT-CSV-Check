import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Types pour les équipements
export interface EquipmentType {
  id: number;
  nom: string;
}

export interface EquipmentModel {
  id: number;
  nom: string;
  type: string;
}

export interface Equipment {
  id: number;
  nom: string;
  modele: string;
  quantite: number;
  statut: string;
}

// Type pour les équipements consolidés
export interface ConsolidatedEquipment {
  modele: string;
  type: string;
  quantite: number;
}

// Type pour le store
interface EquipmentState {
  // États sélectionnés
  selectedType: EquipmentType | null;
  selectedModel: EquipmentModel | null;

  // Données chargées depuis l'API
  equipmentTypes: EquipmentType[];
  equipmentModels: EquipmentModel[];
  equipments: Equipment[];

  // Données consolidées
  consolidatedEquipments: ConsolidatedEquipment[];
  isConsolidationModified: boolean;

  // Gestion de la pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;

  // Gestion des erreurs et chargement
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedType: (type: EquipmentType | null) => void;
  setSelectedModel: (model: EquipmentModel | null) => void;
  setEquipmentTypes: (types: EquipmentType[]) => void;
  setEquipmentModels: (models: EquipmentModel[]) => void;
  setEquipments: (equipments: Equipment[]) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  resetSelection: () => void;

  // Actions pour la consolidation
  setConsolidatedEquipments: (equipments: ConsolidatedEquipment[]) => void;
  updateConsolidatedEquipment: (index: number, updatedEquipment: ConsolidatedEquipment) => void;
  consolidateEquipments: () => void;
  setIsConsolidationModified: (isModified: boolean) => void;

  // Action pour charger les équipements depuis un fichier
  loadEquipmentsFromFile: (filePath: string) => Promise<void>;
}

// Création du store avec persistance
export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      // États initiaux
      selectedType: null,
      selectedModel: null,
      equipmentTypes: [],
      equipmentModels: [],
      equipments: [],
      consolidatedEquipments: [],
      isConsolidationModified: false,
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      isLoading: false,
      error: null,

      // Actions
      setSelectedType: (type) => set({ selectedType: type, selectedModel: null }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setEquipmentTypes: (types) => set({ equipmentTypes: types }),
      setEquipmentModels: (models) => set({ equipmentModels: models }),
      setEquipments: (equipments) => set({ equipments }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setTotalPages: (pages) => set({ totalPages: pages }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      resetSelection: () => set({ selectedType: null, selectedModel: null }),

      // Actions pour la consolidation
      setConsolidatedEquipments: (consolidatedEquipments) => set({
        consolidatedEquipments,
        isConsolidationModified: false
      }),
      updateConsolidatedEquipment: (index, updatedEquipment) => {
        const updatedEquipments = [...get().consolidatedEquipments];
        updatedEquipments[index] = updatedEquipment;
        set({
          consolidatedEquipments: updatedEquipments,
          isConsolidationModified: true
        });
      },
      consolidateEquipments: () => {
        const { equipments } = get();

        // Vérification que equipments est un tableau valide
        if (!Array.isArray(equipments) || equipments.length === 0) {
          set({
            consolidatedEquipments: [],
            isConsolidationModified: false
          });
          return;
        }

        try {
          // Créer un Map pour regrouper les équipements par modèle
          const equipmentMap = new Map<string, ConsolidatedEquipment>();

          equipments.forEach(equipment => {
            if (!equipment || typeof equipment !== 'object') {
              return; // Ignorer les entrées invalides
            }

            const key = equipment.modele;
            if (!key) return; // Ignorer si le modèle est undefined

            if (equipmentMap.has(key)) {
              // Si le modèle existe déjà, additionner la quantité
              const existingEquipment = equipmentMap.get(key)!;
              existingEquipment.quantite += equipment.quantite || 0;
            } else {
              // Déterminer le type d'équipement en fonction du modèle
              let equipType = 'Autre';
              if (key.includes('Écran')) {
                equipType = 'Écran';
              } else if (key.includes('Portable') || key.includes('MacBook')) {
                equipType = 'Ordinateur Portable';
              } else if (key.includes('Serveur') || key.includes('PowerEdge')) {
                equipType = 'Serveur';
              }

              // Créer une nouvelle entrée
              equipmentMap.set(key, {
                modele: key,
                type: equipType,
                quantite: equipment.quantite || 0
              });
            }
          });

          // Convertir le Map en tableau
          const consolidatedEquipments = Array.from(equipmentMap.values());

          set({
            consolidatedEquipments,
            isConsolidationModified: false
          });
        } catch (error) {
          console.error("Erreur lors de la consolidation des équipements:", error);
          set({
            error: "Une erreur est survenue lors de la consolidation des équipements.",
            consolidatedEquipments: [],
            isConsolidationModified: false
          });
        }
      },
      setIsConsolidationModified: (isModified) => set({ isConsolidationModified: isModified }),

      // Action pour charger les équipements depuis un fichier
      loadEquipmentsFromFile: async (filePath: string) => {
        set({ isLoading: true });
        
        try {
          // Appeler une API pour charger les équipements depuis le fichier validé
          const response = await axios.post('http://localhost:8000/api/load-equipment', {
            file_path: filePath
          });
          
          set({ 
            equipments: response.data.equipments,
            isLoading: false 
          });
        } catch (error) {
          console.error("Erreur lors du chargement des équipements:", error);
          set({ 
            error: "Erreur lors du chargement des équipements", 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'equipment-storage',
    }
  )
);