import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConsolidatedEquipment } from './equipment-store';

// Type pour un export enregistré
export interface ExportFile {
  id: string;
  nom: string;
  date: string;
  donnees: ConsolidatedEquipment[];
}

// Type pour le store
interface ExportState {
  // Liste des exports enregistrés
  exports: ExportFile[];

  // États et erreurs
  isLoading: boolean;
  error: string | null;

  // Actions
  addExport: (exportFile: ExportFile) => void;
  removeExport: (id: string) => void;
  clearExports: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Création du store avec persistance
export const useExportStore = create<ExportState>()(
  persist(
    (set, get) => ({
      // États initiaux
      exports: [],
      isLoading: false,
      error: null,

      // Actions
      addExport: (exportFile) => {
        set((state) => ({
          exports: [exportFile, ...state.exports]
        }));
      },
      removeExport: (id) => {
        set((state) => ({
          exports: state.exports.filter(exp => exp.id !== id)
        }));
      },
      clearExports: () => {
        set({ exports: [] });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'export-history-storage',
    }
  )
);
