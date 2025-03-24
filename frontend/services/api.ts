import axios from 'axios';
import { FileData } from '@/lib/validation-utils';
import { ConsolidatedEquipment } from '@/store/equipment-store';

// Créer une instance axios avec la configuration de base
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interface pour les résultats de validation
interface ValidationResult {
  is_valid: boolean;
  missing_required_columns?: string[];
  type_errors?: Array<{
    column: string;
    value: string;
    critical: boolean;
    suggestion?: string;
  }>;
  general_error?: string;
  temp_file_path?: string;
  processed_data?: FileData[];
}

// Interface pour les résultats de correction
interface CorrectionResult {
  success: boolean;
  message: string;
  corrected_file_path?: string;
}

// Interface pour les résultats de mapping
interface MappingResult {
  success: boolean;
  message: string;
  processed_data?: FileData[];
}

// Interface pour les résultats de consolidation
interface ConsolidationResult {
  success: boolean;
  consolidated_equipments: ConsolidatedEquipment[];
}

// Interface pour les résultats d'exportation
interface ExportResult {
  success: boolean;
  message: string;
  filename: string;
  file_path: string;
}

// Interface pour les résultats de récupération de données
interface GetFileDataResult {
  success: boolean;
  data: FileData[];
  columns: string[];
}

// Fonction pour valider un fichier
export const validateFile = async (file: File): Promise<ValidationResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/api/validate-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Erreur lors de la validation du fichier');
    }
    throw new Error('Erreur lors de la validation du fichier');
  }
};

// Fonction pour corriger une erreur spécifique
export const correctError = async (
  filePath: string,
  correction: { column: string; row: number; value: string; correction: string }
): Promise<CorrectionResult> => {
  const formData = new FormData();
  formData.append('file_path', filePath);
  formData.append('column', correction.column);
  formData.append('row', correction.row.toString());
  formData.append('value', correction.value);
  formData.append('correction', correction.correction);
  
  try {
    const response = await api.post('/api/correct-error', formData);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Erreur lors de la correction');
    }
    throw new Error('Erreur lors de la correction');
  }
};

// Fonction pour appliquer toutes les corrections
export const applyCorrections = async (
  filePath: string,
  corrections: Array<{ column: string; row: number; value: string; correction: string }>
): Promise<CorrectionResult> => {
  try {
    const response = await api.post('/api/apply-corrections', {
      file_path: filePath,
      corrections,
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Erreur lors de l\'application des corrections');
    }
    throw new Error('Erreur lors de l\'application des corrections');
  }
};

// Fonction pour appliquer un mapping de colonnes
export const applyMapping = async (
  filePath: string,
  mapping: Record<string, string>
): Promise<MappingResult> => {
  try {
    const response = await api.post('/api/apply-mapping', {
      file_path: filePath,
      mapping,
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Erreur lors de l\'application du mapping');
    }
    throw new Error('Erreur lors de l\'application du mapping');
  }
};

// Fonction pour récupérer les données d'un fichier
export const getFileData = async (filePath: string): Promise<GetFileDataResult> => {
  try {
    const response = await api.get(`/api/get-file-data?file_path=${encodeURIComponent(filePath)}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Erreur lors de la récupération des données');
    }
    throw new Error('Erreur lors de la récupération des données');
  }
};

// Fonction pour consolider les équipements
export const consolidateEquipments = async (
  filePath?: string,
  equipments?: FileData[],
  groupByFields: string[] = ['modele', 'type']
): Promise<ConsolidationResult> => {
  try {
    const payload: any = { group_by_fields: groupByFields };
    
    if (filePath) {
      payload.file_path = filePath;
    } else if (equipments) {
      payload.equipments = equipments;
    } else {
      throw new Error('Vous devez fournir soit un chemin de fichier, soit une liste d\'équipements');
    }
    
    const response = await api.post('/api/consolidate-equipments', payload);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Erreur lors de la consolidation');
    }
    throw new Error('Erreur lors de la consolidation');
  }
};

// Fonction pour exporter les données
export const exportData = async (
  options: {
    format: 'csv' | 'xlsx';
    file_path?: string;
    equipments?: ConsolidatedEquipment[];
  }
): Promise<ExportResult> => {
  try {
    const response = await api.post('/api/export-data', options);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Erreur lors de l\'exportation');
    }
    throw new Error('Erreur lors de l\'exportation');
  }
};

// Fonction pour télécharger un fichier exporté
export const downloadExportedFile = (filename: string): void => {
  window.open(`http://localhost:8000/api/download/${filename}`, '_blank');
};

// Fonction pour nettoyer les fichiers temporaires
export const cleanupTempFiles = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post('/api/cleanup');
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Erreur lors du nettoyage des fichiers temporaires');
    }
    throw new Error('Erreur lors du nettoyage des fichiers temporaires');
  }
};

// Interface pour les résultats de correction de dates
interface DateCorrectionResult {
  success: boolean;
  message: string;
  corrected_file_path?: string;
}

// Fonction pour corriger les formats de date
export const fixDates = async (
  filePath: string,
  dateColumn: string
): Promise<DateCorrectionResult> => {
  const formData = new FormData();
  formData.append('file_path', filePath);
  formData.append('date_column', dateColumn);
  
  try {
    const response = await api.post('/api/fix-dates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Erreur lors de la correction des dates');
    }
    throw new Error('Erreur lors de la correction des dates');
  }
};