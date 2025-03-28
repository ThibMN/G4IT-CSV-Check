import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types d'erreurs
export type ErrorSeverity = 'critique' | 'mineure';

// Interface pour une erreur
export interface FileError {
  id: number;
  type: string;          // Type d'erreur (ex: "En-tête manquant", "Format incorrect")
  colonne: string;       // Nom de la colonne concernée
  gravite: ErrorSeverity;// Niveau de gravité de l'erreur
  valeur?: string;       // Valeur actuelle (si applicable)
  ligne?: number;
  suggestion: string;    // Suggestion de correction
  corrigee: boolean;     // Indique si l'erreur a été corrigée
  correction?: string;   // Valeur de correction si modifiée par l'utilisateur
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
  addErrors: (newErrors: NewFileError[]) => void;
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

// Type pour les nouvelles erreurs (avant d'avoir un ID)
export interface NewFileError {
  type: string;
  column: string;
  severity: 'critical' | 'warning';
  value?: string;
  row?: number;
  message: string;
  suggestions?: string[];
  corrected?: boolean;
}

// Création du store avec persistance
export const useErrorStore = create<ErrorState>()(
  persist(
    (set, get) => ({
      // États initiaux
      errors: [],
      isLoading: false,
      error: null,

      // Actions
      setErrors: (errors) => set({ errors }),

      addErrors: (newErrors) => set((state) => {
        // Trouver le plus grand ID actuel pour générer de nouveaux IDs
        const maxId = state.errors.reduce((max, err) => Math.max(max, err.id), 0);

        // Convertir les nouvelles erreurs au format du store
        const formattedErrors: FileError[] = newErrors.map((err, index) => ({
          id: maxId + index + 1,
          type: err.type,
          colonne: err.column,
          gravite: err.severity === 'critical' ? 'critique' : 'mineure',
          valeur: err.value,
          ligne: err.row,
          suggestion: err.message,
          suggestions: err.suggestions,
          corrigee: err.corrected || false
        }));

        return { errors: [...state.errors, ...formattedErrors] };
      }),

      updateError: (id, updates) => set((state) => ({
        errors: state.errors.map(err =>
          err.id === id ? { ...err, ...updates } : err
        ),
      })),

      markErrorAsCorrected: (id, correction) => set((state) => ({
        errors: state.errors.map(err =>
          err.id === id ? { ...err, corrigee: true, correction } : err
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
        const critique = errors.filter(err => err.gravite === 'critique' && !err.corrigee).length;
        const mineure = errors.filter(err => err.gravite === 'mineure' && !err.corrigee).length;
        return {
          critique,
          mineure,
          total: critique + mineure
        };
      },

      hasCriticalErrors: () => {
        return get().errors.some(err => err.gravite === 'critique' && !err.corrigee);
      },
    }),
    {
      name: 'file-errors-storage',
    }
  )
);
