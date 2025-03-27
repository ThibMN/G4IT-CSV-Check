import { create } from 'zustand';

interface FileState {
  currentFile: File | null;
  setCurrentFile: (file: File | null) => void;
  detectedColumns: string[];
  setDetectedColumns: (columns: string[]) => void;
}

export const useFileStore = create<FileState>((set) => ({
  currentFile: null,
  setCurrentFile: (file) => set({ currentFile: file }),
  detectedColumns: [],
  setDetectedColumns: (columns) => set({ detectedColumns: columns }),
}));