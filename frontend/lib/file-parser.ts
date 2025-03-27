import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { FileData } from './validation-utils';

// Interface pour les résultats du parsing de fichier
export interface ParseResult {
  data: FileData[];
  error?: string;
}

// Parser un fichier CSV
export const parseCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Nettoyer les en-têtes (supprimer les espaces, caractères spéciaux)
        return header.trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
          .replace(/\s+/g, '') // Supprimer les espaces
          .replace(/[^\w]/g, ''); // Supprimer les caractères spéciaux
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
        const data = e.target?.result;
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
          // Nettoyer les en-têtes (supprimer les espaces, caractères spéciaux)
          return String(header).trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
            .replace(/\s+/g, '') // Supprimer les espaces
            .replace(/[^\w]/g, ''); // Supprimer les caractères spéciaux
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
