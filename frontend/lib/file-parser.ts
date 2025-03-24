import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Type pour les données de fichier
export type FileData = Record<string, any>;

// Interface pour les résultats de lecture de fichier
export interface ReadResult {
  fileContent: string | ArrayBuffer | null;
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'unsupported';
  previewData?: any[];
  error?: string;
}

// Interface pour les résultats de parsing
export interface ParseResult {
  data: FileData[];
  error?: string;
}

/**
 * Lit le contenu brut d'un fichier CSV ou XLSX.
 * Fournit uniquement un aperçu simple, sans transformation majeure.
 */
export const readFile = (file: File): Promise<ReadResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const fileName = file.name;
    const fileExt = fileName.toLowerCase().split('.').pop() || '';
    
    let fileType: 'csv' | 'xlsx' | 'unsupported' = 'unsupported';
    if (fileExt === 'csv') fileType = 'csv';
    else if (fileExt === 'xlsx' || fileExt === 'xls') fileType = 'xlsx';
    
    if (fileType === 'unsupported') {
      resolve({
        fileContent: null,
        fileName,
        fileType,
        error: "Format de fichier non supporté. Veuillez utiliser un fichier CSV ou XLSX."
      });
      return;
    }
    
    // Pour CSV, lire comme texte
    if (fileType === 'csv') {
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          // Générer un aperçu minimal pour l'UI (premiers 3 lignes seulement)
          let previewData: any[] = [];
          try {
            const previewResult = Papa.parse(content, {
              header: true,
              skipEmptyLines: true,
              preview: 3, // Limite à 3 lignes pour l'aperçu
              transformHeader: (header) => header.trim() // Nettoyage minimal
            });
            previewData = previewResult.data;
          } catch (e) {
            // Ignorer les erreurs d'aperçu, ce n'est pas critique
          }
          
          resolve({
            fileContent: content,
            fileName,
            fileType,
            previewData
          });
        } catch (error: any) {
          resolve({
            fileContent: null,
            fileName,
            fileType,
            error: `Erreur lors de la lecture du fichier: ${error.message || "Erreur inconnue"}`
          });
        }
      };
      reader.readAsText(file);
    } 
    // Pour XLSX, lire comme binaire
    else {
      reader.onload = (e) => {
        try {
          const content = e.target?.result || null;  // Ajouter || null ici pour éviter undefined
          
          // Générer un aperçu minimal pour l'UI
          let previewData: any[] = [];
          try {
            const workbook = XLSX.read(content, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            previewData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', range: 0, blankrows: false });
            previewData = previewData.slice(0, 4); // Limiter à 4 lignes (en-tête + 3 lignes)
          } catch (e) {
            // Ignorer les erreurs d'aperçu
          }
          
          resolve({
            fileContent: content,
            fileName,
            fileType,
            previewData
          });
        } catch (error: any) {
          resolve({
            fileContent: null,
            fileName,
            fileType,
            error: `Erreur lors de la lecture du fichier XLSX: ${error.message || "Erreur inconnue"}`
          });
        }
      };
      reader.readAsBinaryString(file);
    }
    
    reader.onerror = () => {
      resolve({
        fileContent: null,
        fileName,
        fileType,
        error: "Erreur lors de la lecture du fichier"
      });
    };
  });
};

/**
 * ATTENTION: Ces fonctions sont conservées pour compatibilité,
 * mais idéalement la validation devrait être déléguée au backend.
 * Utiliser readFile() à la place pour de nouveaux développements.
 */

// Parser un fichier CSV
export const parseCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        return header.trim();
      },
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          const errorMsg = results.errors.map(err => `Ligne ${err.row}: ${err.message}`).join('; ');
          resolve({
            data: results.data as FileData[],
            error: `Erreurs lors du parsing CSV: ${errorMsg}`
          });
        } else {
          resolve({ data: results.data as FileData[] });
        }
      },
      error: (error) => {
        resolve({
          data: [],
          error: `Erreur lors du parsing CSV: ${error.message}`
        });
      }
    });
  });
};

// Parser un fichier XLSX
export const parseXLSX = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result || null;
        if (!data) {
          resolve({ data: [], error: "Erreur lors de la lecture du fichier XLSX" });
          return;
        }

        // Convertir le contenu binaire en workbook
        const workbook = XLSX.read(data, { type: 'binary' });

        // Récupérer la première feuille
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir la feuille en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: ''
        });

        // S'assurer que nous avons des données
        if (jsonData.length <= 1) {
          resolve({ data: [], error: "Le fichier XLSX ne contient pas suffisamment de données" });
          return;
        }

        // Obtenir les en-têtes (première ligne)
        const headers = (jsonData[0] as string[]).map(header => {
          return String(header).trim();
        });

        // Convertir les données en objets avec les en-têtes
        const result: FileData[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row.length === 0) continue; // Ignorer les lignes vides

          const obj: FileData = {};
          headers.forEach((header, index) => {
            if (header) { // Ne pas inclure les en-têtes vides
              obj[header] = row[index] !== undefined ? row[index] : '';
            }
          });

          // Ne pas inclure les lignes complètement vides
          const hasValues = Object.values(obj).some(v => v !== '' && v !== undefined && v !== null);
          if (hasValues) {
            result.push(obj);
          }
        }

        resolve({ data: result });
      } catch (error: any) {
        resolve({
          data: [],
          error: `Erreur lors du parsing XLSX: ${error.message || "Erreur inconnue"}`
        });
      }
    };

    reader.onerror = () => {
      resolve({
        data: [],
        error: "Erreur lors de la lecture du fichier XLSX"
      });
    };

    // Lire le fichier comme un tableau binaire
    reader.readAsBinaryString(file);
  });
};

// Fonction principale pour parser les fichiers (détecte automatiquement le type)
export const parseFile = async (file: File): Promise<ParseResult> => {
  // Vérifier le type de fichier
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    return parseCSV(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseXLSX(file);
  } else {
    return {
      data: [],
      error: "Format de fichier non supporté. Veuillez utiliser un fichier CSV ou XLSX."
    };
  }
};
