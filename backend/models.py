from typing import Dict, List, Any, Optional
import csv
import pandas as pd
import os
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Spécifications des colonnes G4IT
G4IT_COLUMN_SPECS = {
    "equipmentType": {
        "required": True,
        "description": "Type d'équipement",
        "examples": ["Laptop", "Desktop", "Server"]
    },
    "manufacturer": {
        "required": True,
        "description": "Fabricant de l'équipement",
        "examples": ["Dell", "HP", "Lenovo"]
    },
    "model": {
        "required": True,
        "description": "Modèle spécifique de l'équipement",
        "examples": ["XPS 13", "EliteBook 840", "ThinkPad T14"]
    },
    "quantity": {
        "required": True,
        "description": "Nombre d'unités de cet équipement",
        "examples": ["1", "5", "10"]
    },
    "cpu": {
        "required": False,
        "description": "Processeur de l'équipement",
        "examples": ["Intel i5", "AMD Ryzen 7", "Apple M1"]
    },
    "ram": {
        "required": False,
        "description": "Mémoire vive en GB",
        "examples": ["8", "16", "32"]
    },
    "storage": {
        "required": False,
        "description": "Stockage en GB",
        "examples": ["256", "512", "1000"]
    },
    "purchaseYear": {
        "required": False,
        "description": "Année d'achat",
        "examples": ["2020", "2021", "2022"]
    },
    "eol": {
        "required": False,
        "description": "Fin de vie prévue (année)",
        "examples": ["2025", "2026", "2027"]
    }
}

def check_file(file_path: str) -> tuple[bool, str]:
    """
    Vérifie le type du fichier et retourne son format si valide.

    Args:
        file_path: Chemin vers le fichier à vérifier

    Returns:
        tuple: (est_valide, format_ou_erreur)
    """
    if not os.path.exists(file_path):
        return False, "Le fichier n'existe pas"

    file_extension = os.path.splitext(file_path)[1].lower()

    if file_extension == '.csv':
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                # Vérifier que le fichier a au moins une ligne
                first_line = f.readline()
                if not first_line:
                    return False, "Le fichier CSV est vide"
            return True, "csv"
        except Exception as e:
            return False, f"Erreur lors de la lecture du fichier CSV: {str(e)}"

    elif file_extension in ['.xlsx', '.xls']:
        try:
            # Vérifier que le fichier Excel est valide
            pd.read_excel(file_path, nrows=1)
            return True, "excel"
        except Exception as e:
            return False, f"Erreur lors de la lecture du fichier Excel: {str(e)}"

    else:
        return False, "Format de fichier non supporté. Utilisez CSV ou XLSX."

def validate_columns(headers: List[str]) -> Dict[str, Any]:
    """
    Valide les en-têtes de colonnes par rapport aux spécifications G4IT.

    Args:
        headers: Liste des en-têtes de colonnes

    Returns:
        Dict: Rapport de validation
    """
    required_columns = [col for col, spec in G4IT_COLUMN_SPECS.items() if spec["required"]]
    optional_columns = [col for col, spec in G4IT_COLUMN_SPECS.items() if not spec["required"]]

    # Vérifier les colonnes requises
    missing_columns = [col for col in required_columns if col not in headers]

    # Vérifier si le fichier est valide (toutes les colonnes requises sont présentes)
    is_valid = len(missing_columns) == 0

    return {
        "is_valid": is_valid,
        "detected_columns": headers,
        "required_columns": required_columns,
        "optional_columns": optional_columns,
        "missing_required_columns": missing_columns
    }

class FileHandler:
    """Classe de base pour gérer les fichiers"""

    def __init__(self, file_path: str):
        self.file_path = file_path

    def validate_columns(self) -> Dict[str, Any]:
        """
        Valide les colonnes du fichier.
        À implémenter dans les classes dérivées.
        """
        raise NotImplementedError("Cette méthode doit être implémentée dans les classes dérivées")

class CsvHandler(FileHandler):
    """Classe pour gérer les fichiers CSV"""

    def validate_columns(self) -> Dict[str, Any]:
        """
        Valide les colonnes du fichier CSV.

        Returns:
            Dict: Rapport de validation
        """
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                headers = next(reader)

            return validate_columns(headers)
        except Exception as e:
            logger.error(f"Erreur lors de la validation du CSV: {str(e)}")
            return {
                "is_valid": False,
                "error": f"Erreur lors de la validation du CSV: {str(e)}"
            }

class XlsxHandler(FileHandler):
    """Classe pour gérer les fichiers Excel"""

    def validate_columns(self) -> Dict[str, Any]:
        """
        Valide les colonnes du fichier Excel.

        Returns:
            Dict: Rapport de validation
        """
        try:
            df = pd.read_excel(self.file_path)
            headers = df.columns.tolist()

            return validate_columns(headers)
        except Exception as e:
            logger.error(f"Erreur lors de la validation du fichier Excel: {str(e)}")
            return {
                "is_valid": False,
                "error": f"Erreur lors de la validation du fichier Excel: {str(e)}"
            }
