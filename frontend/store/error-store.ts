import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types d'erreurs
export type ErrorSeverity = 'critique' | 'mineure';

// Interface pour une erreur
export interface FileError {
  id: number; // Généré côté frontend pour tracking
  row: number; // Ajout du numéro de ligne
  column: string; // Au lieu de "colonne"
  error: string; // Au lieu de "suggestion"
  severity: 'critical' | 'minor'; // Déterminé en fonction du type d'erreur
  value?: string; // Peut être conservé pour l'interface utilisateur
  fixed: boolean; // Au lieu de "corrigee"
}

// Interface pour le store
interface ErrorState {
  // Liste des erreurs détectées
  errors: FileError[];

  // États divers
  isLoading: boolean;
  error: string | null;

  // Actions
  setErrors: (errors: FileError[]) => void;
  updateError: (id: number, updates: Partial<FileError>) => void;
  markErrorAsCorrected: (id: number, correction?: string) => void;
  deleteError: (id: number) => void;
  clearErrors: () => void;
  setLoading: (isLoading: boolean) => void;
  setErrorMessage: (error: string | null) => void;

  // Accesseurs (getters)
  getErrorCount: () => { critique: number; mineure: number; total: number };
  hasCriticalErrors: () => boolean;
}

// Exemples d'erreurs pour le développement
const mockErrors: FileError[] = [
  {
    id: 1,
    row: 1,
    column: "nomEquipementPhysique",
    severity: "critical",
    error: "Ajoutez cette colonne au fichier source.",
    fixed: false
  },
  {
    id: 2,
    row: 2,
    column: "dateAchat",
    severity: "minor",
    value: "03/15/2023",
    error: "Convertissez au format YYYY-MM-DD : 2023-03-15",
    fixed: false
  },
  {
    id: 3,
    row: 3,
    column: "statut",
    severity: "minor",
    value: "",
    error: "Renseignez une valeur par défaut : 'En service'.",
    fixed: false
  },
  {
    id: 4,
    row: 4,
    column: "quantite",
    severity: "critical",
    value: "-5",
    error: "La quantité doit être un nombre positif.",
    fixed: false
  },
  {
    id: 5,
    row: 5,
    column: "type",
    severity: "minor",
    value: "écran",
    error: "Standardisez le type : 'Écran'",
    fixed: false
  }
];

// Création du store avec persistance
export const useErrorStore = create<ErrorState>()(
  persist(
    (set, get) => ({
      // États initiaux
      errors: [], // Était mockErrors
      isLoading: false,
      error: null,

      // Actions
      setErrors: (errors) => set({ errors }),

      updateError: (id, updates) => set((state) => ({
        errors: state.errors.map(err =>
          err.id === id ? { ...err, ...updates } : err
        ),
      })),

      markErrorAsCorrected: (id, correction) => set((state) => ({
        errors: state.errors.map(err =>
          err.id === id ? { ...err, fixed: true, correction } : err
        ),
      })),

      deleteError: (id) => set((state) => ({
        errors: state.errors.filter(err => err.id !== id),
      })),

      clearErrors: () => set({ errors: [] }),

      setLoading: (isLoading) => set({ isLoading }),

      setErrorMessage: (error) => set({ error }),

      // Accesseurs (getters)
      getErrorCount: () => {
        const errors = get().errors;
        const critique = errors.filter(err => err.severity === 'critical' && !err.fixed).length;
        const mineure = errors.filter(err => err.severity === 'minor' && !err.fixed).length;
        return {
          critique,
          mineure,
          total: critique + mineure
        };
      },

      hasCriticalErrors: () => {
        return get().errors.some(err => err.severity === 'critical' && !err.fixed);
      },
    }),
    {
      name: 'file-errors-storage',
    }
  )
);
