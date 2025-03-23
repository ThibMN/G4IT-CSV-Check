import { saveAs } from 'file-saver';
import { ConsolidatedEquipment } from '@/store/equipment-store';
import { processFileData } from './validation-utils';
import { FileData } from './validation-utils';
import { useErrorStore } from '@/store/error-store';

// En-têtes requises pour un export valide
export const requiredHeaders = ["modele", "type", "quantite"];

// Fonction pour vérifier si une en-tête requise est manquante
export const checkRequiredHeaders = (data: ConsolidatedEquipment[]): string[] => {
  if (!data || data.length === 0) {
    return ["Aucune donnée à exporter"];
  }

  const firstItem = data[0];
  const missingHeaders: string[] = [];

  requiredHeaders.forEach(header => {
    if (!(header in firstItem)) {
      missingHeaders.push(header);
    }
  });

  return missingHeaders;
};

// Fonction pour vérifier les erreurs dans les données avant export
export const validateExportData = (data: any[]): {
  isValid: boolean;
  redirectToErrorPage: boolean;
  errors: string[];
} => {
  // Vérifier si des données sont présentes
  if (!data || data.length === 0) {
    return {
      isValid: false,
      redirectToErrorPage: false,
      errors: ["Aucune donnée à exporter"]
    };
  }

  // Vérifier les en-têtes requises
  const missingHeaders = checkRequiredHeaders(data as ConsolidatedEquipment[]);
  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      redirectToErrorPage: true,
      errors: [`En-têtes manquantes : ${missingHeaders.join(", ")}`]
    };
  }

  // Traiter et valider plus en profondeur les données
  const { errors, canExport } = processFileData(data as FileData[]);

  // Si des erreurs sont détectées, les enregistrer dans le store et rediriger
  if (errors.length > 0) {
    // Cette partie doit être gérée par le composant appelant
    // car nous ne pouvons pas utiliser le hook useErrorStore directement ici
    return {
      isValid: canExport,
      redirectToErrorPage: errors.length > 0,
      errors: errors.map(err => `${err.type} (${err.colonne}): ${err.suggestion}`)
    };
  }

  return { isValid: true, redirectToErrorPage: false, errors: [] };
};

// Fonction pour convertir des données au format CSV
export const convertToCSV = (data: ConsolidatedEquipment[]): string => {
  if (!data || data.length === 0) {
    return "";
  }

  // Définir les en-têtes en français
  const headers = {
    modele: "Modèle",
    type: "Type d'équipement",
    quantite: "Quantité"
  };

  // Créer la ligne d'en-tête
  const headerRow = Object.values(headers).join(";");

  // Créer les lignes de données
  const rows = data.map(item => {
    return `${item.modele};${item.type};${item.quantite}`;
  });

  // Combiner l'en-tête et les lignes de données
  return [headerRow, ...rows].join("\n");
};

// Fonction pour générer un nom de fichier au format spécifié
export const generateFileName = (baseName: string = "Export"): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${baseName}_NumEcoEval_${year}-${month}-${day}.csv`;
};

// Fonction pour générer et télécharger un fichier CSV
export const exportCSV = (
  data: ConsolidatedEquipment[],
  fileName?: string,
  skipValidation: boolean = false
): {
  success: boolean;
  fileName?: string;
  error?: string;
  redirectToErrorPage?: boolean;
} => {
  try {
    // Valider les données avant export (sauf si explicitement désactivé)
    if (!skipValidation) {
      const validation = validateExportData(data);

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join("; "),
          redirectToErrorPage: validation.redirectToErrorPage
        };
      }
    }

    // Convertir les données en CSV
    const csvContent = convertToCSV(data);

    // Générer un nom de fichier si non fourni
    const finalFileName = fileName || generateFileName();

    // Créer un Blob et télécharger le fichier
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, finalFileName);

    return {
      success: true,
      fileName: finalFileName
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erreur lors de l'export CSV: ${error.message || 'Erreur inconnue'}`
    };
  }
};
