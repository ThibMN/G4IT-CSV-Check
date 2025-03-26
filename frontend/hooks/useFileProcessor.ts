import { useState } from 'react';
import { validateFile, fixDates, downloadProcessedFile, cleanupTempFile } from '../services/api';
import { readFile } from '../lib/file-parser';
import { useErrorStore, FileError } from '../store/error-store'; // Ajout de cette ligne

interface ValidationResult {
  is_valid: boolean;
  missing_required_columns: string[];
  type_errors: Array<{
    row: number;
    column: string;
    error: string;
  }>;
  temp_file_path?: string;
  original_filename?: string;
  file_format?: string;
  general_error?: string;
}

export const useFileProcessor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<any[] | null>(null);
  const errorStore = useErrorStore();
  
  const processFile = async (file: File) => {
    console.log("⬆️ Début du traitement du fichier:", file.name);
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Lire le fichier pour avoir un aperçu côté client (facultatif)
      const readResult = await readFile(file);
      if (readResult.error) {
        throw new Error(readResult.error);
      }
      
      // Mettre à jour l'aperçu si disponible
      if (readResult.previewData) {
        setFilePreview(readResult.previewData);
      }
      
      // 2. Envoyer le fichier au backend pour validation
      console.log("📤 Envoi du fichier au backend...");
      console.log(`   Type: ${file.type}, Taille: ${Math.round(file.size/1024)}KB`);
      
      const result = await validateFile(file);
      console.log("📥 Réponse reçue du backend:", result);
      setValidationResult(result);
      
      // Si des erreurs sont présentes dans le résultat, les stocker dans le store
      if (result.type_errors?.length > 0) {
        // Convertir le format d'erreur du backend au format du store
        const storeErrors: FileError[] = result.type_errors.map((err: { row: number; column: any; value: any; error: any; }, index: number) => ({
          id: index + 1,
          row: err.row,
          column: err.column,
          severity: err.row === 0 ? "critical" : "minor", // Assurez-vous que ces valeurs correspondent à celles attendues
          value: err.value,
          error: err.error,
          fixed: false
        }));
        
        errorStore.setErrors(storeErrors);
      }
      
      return result;
    } catch (err: any) {
      console.error("❌ ERREUR:", err);
      if (err.response) {
        console.error("   Status:", err.response.status);
        console.error("   Data:", err.response.data);
        setError(err.response.data?.detail || 'Une erreur est survenue lors du traitement du fichier');
      } else {
        setError(err.message || 'Une erreur est survenue lors du traitement du fichier');
      }
      return null;
    } finally {
      setIsLoading(false);
      console.log("⬇️ Fin du traitement du fichier");
    }
  };
  
  const correctDates = async (filePath: string, dateColumn: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fixDates(filePath, dateColumn);
      return result;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de la correction des dates');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadFile = async (filePath: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await downloadProcessedFile(filePath);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors du téléchargement du fichier');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const cleanup = async (filePath: string) => {
    try {
      await cleanupTempFile(filePath);
    } catch (err) {
      console.error('Échec de la suppression du fichier temporaire:', err);
    }
  };
  
  return {
    isLoading,
    validationResult,
    error,
    processFile,
    correctDates,
    downloadFile,
    cleanup
  };
};