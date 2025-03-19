import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Définition des types pour le store
interface HeaderMappingState {
  // Mapping entre l'index des colonnes détectées et les clés des en-têtes attendus
  mapping: Record<number, string>;
  // Fonction pour définir le mapping
  setMapping: (mapping: Record<number, string>) => void;
  // Fonction pour effacer le mapping
  clearMapping: () => void;
}

// Création du store avec persistance
export const useHeaderMappingStore = create<HeaderMappingState>()(
  persist(
    (set) => ({
      mapping: {},
      setMapping: (mapping) => set({ mapping }),
      clearMapping: () => set({ mapping: {} }),
    }),
    {
      name: 'header-mapping-storage',
    }
  )
);
