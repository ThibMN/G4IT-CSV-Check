import { create } from 'zustand';

export type ProcessedEquipment = {
  [key: string]: any; // Structure dynamique basée sur le mapping
};

interface ProcessedDataState {
  processedData: ProcessedEquipment[];
  setProcessedData: (data: ProcessedEquipment[]) => void;
  clearProcessedData: () => void;
}

export const useProcessedDataStore = create<ProcessedDataState>((set) => ({
  processedData: [],
  setProcessedData: (data) => set({ processedData: data }),
  clearProcessedData: () => set({ processedData: [] }),
}));