import { FileError } from "@/store/error-store";

// Interface pour les données CSV/XLSX
export interface FileData {
  [key: string]: any;
}

// Interface pour les règles de validation
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'email';
  format?: RegExp | ((value: any) => boolean);
  min?: number;
  max?: number;
  message?: string;
  severity?: 'critique' | 'mineure';
  suggestion?: string | ((value: any) => string);
}

// Définition des en-têtes obligatoires
export const REQUIRED_HEADERS = [
  "nomEquipementPhysique",
  "type",
  "statut",
  "quantite"
];

// Définition des règles de validation
export const VALIDATION_RULES: ValidationRule[] = [
  {
    field: "nomEquipementPhysique",
    required: true,
    type: "string",
    message: "Le nom de l'équipement est obligatoire",
    severity: "critique",
    suggestion: "Ajoutez un nom d'équipement"
  },
  {
    field: "type",
    required: true,
    type: "string",
    message: "Le type d'équipement est obligatoire",
    severity: "critique",
    suggestion: "Choisissez un type d'équipement (ex: Ordinateur, Écran, Serveur)"
  },
  {
    field: "statut",
    required: true,
    type: "string",
    message: "Le statut est obligatoire",
    severity: "mineure",
    suggestion: "Renseignez 'En service' par défaut"
  },
  {
    field: "quantite",
    required: true,
    type: "number",
    min: 1,
    message: "La quantité doit être un nombre positif",
    severity: "critique",
    suggestion: (value) => {
      if (value === undefined || value === null || value === "") return "Renseignez une quantité (ex: 1)";
      if (typeof value === "string" && !isNaN(Number(value)) && Number(value) <= 0) return "La quantité doit être supérieure à 0";
      return "Entrez une valeur numérique positive";
    }
  },
  {
    field: "dateAchat",
    type: "date",
    format: (value) => {
      // Format YYYY-MM-DD
      if (!value) return true;
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(value)) return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message: "Le format de date doit être YYYY-MM-DD",
    severity: "mineure",
    suggestion: (value) => {
      if (!value) return "Renseignez une date au format YYYY-MM-DD";

      // Essayer de convertir divers formats en YYYY-MM-DD
      try {
        // Format MM/DD/YYYY américain
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const parts = value.split('/');
          return `Convertissez au format YYYY-MM-DD : ${parts[2]}-${parts[0]}-${parts[1]}`;
        }

        // Format DD/MM/YYYY français
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const parts = value.split('/');
          return `Convertissez au format YYYY-MM-DD : ${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        // Format avec des points DD.MM.YYYY
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
          const parts = value.split('.');
          return `Convertissez au format YYYY-MM-DD : ${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      } catch (e) {
        // En cas d'erreur, donner une suggestion générique
      }

      return "Convertissez au format YYYY-MM-DD (ex: 2023-01-31)";
    }
  }
];

// Fonction pour vérifier les en-têtes manquantes
export const checkMissingHeaders = (data: FileData[]): FileError[] => {
  if (!data || data.length === 0) return [];

  const presentHeaders = Object.keys(data[0]);
  const errors: FileError[] = [];
  let id = 1;

  // Vérifier chaque en-tête requise
  REQUIRED_HEADERS.forEach(header => {
    if (!presentHeaders.includes(header)) {
      errors.push({
        id: id++,
        type: "En-tête manquant",
        colonne: header,
        gravite: "critique",
        suggestion: `Ajoutez la colonne "${header}" au fichier source.`,
        corrigee: false
      });
    }
  });

  return errors;
};

// Fonction pour vérifier les erreurs dans les données
export const validateData = (data: FileData[]): FileError[] => {
  if (!data || data.length === 0) return [];

  const errors: FileError[] = [];
  let id = 1;

  // Vérifier d'abord les en-têtes manquantes
  const missingHeaderErrors = checkMissingHeaders(data);
  errors.push(...missingHeaderErrors);
  id += missingHeaderErrors.length;

  // Si des en-têtes critiques sont manquantes, arrêter la validation des données
  const hasCriticalHeaderErrors = missingHeaderErrors.some(err => err.gravite === "critique");
  if (hasCriticalHeaderErrors) return errors;

  // Vérifier chaque ligne de données
  data.forEach((row, rowIndex) => {
    VALIDATION_RULES.forEach(rule => {
      const value = row[rule.field];
      let hasError = false;
      let errorType = "";

      // Vérifier si la valeur est requise et manquante
      if (rule.required && (value === undefined || value === null || value === "")) {
        hasError = true;
        errorType = "Valeur manquante";
      }
      // Vérifier le type de la valeur
      else if (value !== undefined && value !== null && value !== "" && rule.type) {
        switch (rule.type) {
          case "number":
            if (isNaN(Number(value)) || value === "") {
              hasError = true;
              errorType = "Format incorrect - nombre attendu";
            } else if (rule.min !== undefined && Number(value) < rule.min) {
              hasError = true;
              errorType = `Valeur trop petite (min: ${rule.min})`;
            } else if (rule.max !== undefined && Number(value) > rule.max) {
              hasError = true;
              errorType = `Valeur trop grande (max: ${rule.max})`;
            }
            break;

          case "date":
            if (rule.format && typeof rule.format === "function" && !rule.format(value)) {
              hasError = true;
              errorType = "Format de date incorrect";
            }
            break;

          case "email":
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(String(value))) {
              hasError = true;
              errorType = "Format d'email incorrect";
            }
            break;
        }
      }

      // Si une erreur est détectée, l'ajouter à la liste
      if (hasError) {
        let suggestion = "";
        if (typeof rule.suggestion === "function") {
          suggestion = rule.suggestion(value);
        } else if (rule.suggestion) {
          suggestion = rule.suggestion;
        } else {
          suggestion = rule.message || `Corriger la valeur de ${rule.field}`;
        }

        errors.push({
          id: id++,
          type: errorType || rule.message || "Erreur de validation",
          colonne: rule.field,
          gravite: rule.severity || "mineure",
          valeur: value !== undefined ? String(value) : undefined,
          suggestion,
          corrigee: false
        });
      }
    });
  });

  return errors;
};

// Fonction pour standardiser les données CSV/XLSX
export const standardizeData = (data: FileData[]): FileData[] => {
  if (!data || data.length === 0) return [];

  return data.map(row => {
    const newRow = { ...row };

    // Standardiser les valeurs numériques
    if (newRow.quantite !== undefined) {
      newRow.quantite = Number(newRow.quantite) || 0;
    }

    // Standardiser les statuts
    if (newRow.statut !== undefined) {
      // Convertir en minuscules et supprimer les espaces supplémentaires
      const statut = String(newRow.statut).toLowerCase().trim();

      // Mapper vers des valeurs standardisées
      if (statut === "" || ["n/a", "na", "non applicable"].includes(statut)) {
        newRow.statut = "En service";
      } else if (["actif", "en activité", "fonctionnel", "en fonction"].includes(statut)) {
        newRow.statut = "En service";
      } else if (["inactif", "hors service", "non fonctionnel"].includes(statut)) {
        newRow.statut = "Hors service";
      }
    }

    // Standardiser les types d'équipements
    if (newRow.type !== undefined) {
      const type = String(newRow.type).toLowerCase().trim();

      // Mapper vers des valeurs standardisées
      if (["pc", "ordinateur", "laptop", "desktop"].includes(type)) {
        newRow.type = "Ordinateur";
      } else if (["ecran", "moniteur", "display"].includes(type)) {
        newRow.type = "Écran";
      } else if (["serveur", "server"].includes(type)) {
        newRow.type = "Serveur";
      } else if (["imprimante", "printer"].includes(type)) {
        newRow.type = "Imprimante";
      } else if (["telephone", "phone", "smartphone", "mobile"].includes(type)) {
        newRow.type = "Téléphone";
      }
    }

    return newRow;
  });
};

// Fonction principale pour valider et préparer les données
export const processFileData = (data: FileData[]): {
  errors: FileError[],
  processedData: FileData[],
  canExport: boolean
} => {
  // Valider les données
  const errors = validateData(data);

  // Standardiser les données
  const processedData = standardizeData(data);

  // Vérifier si l'export est possible (pas d'erreurs critiques)
  const hasCriticalErrors = errors.some(err => err.gravite === "critique");

  return {
    errors,
    processedData,
    canExport: !hasCriticalErrors
  };
};
