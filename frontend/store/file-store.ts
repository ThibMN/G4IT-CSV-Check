import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FileState {
  selectedFile: {
    original_filename: string;
    temp_file_path: string;
    file_format: string;
    is_valid: boolean;
  } | null;
  setSelectedFile: (file: any) => void;
  clearSelectedFile: () => void;
}

export const useFileStore = create<FileState>()(
  persist(
    (set) => ({
      selectedFile: null,
      setSelectedFile: (file) => set({ selectedFile: file }),
      clearSelectedFile: () => set({ selectedFile: null }),
    }),
    { name: 'file-storage' }
  )
);