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
    # Informations d'identification de l'équipement
    'nomEquipementPhysique': {
        'required': True,
        'type': 'string',
        'example': 'Serveur Dell PowerEdge R740',
        'description': "Nom ou référence de l'équipement physique"
    },
    'modele': {
        'required': True,
        'type': 'string',
        'example': 'Serveur-Milieu-de-Gamme',
        'description': "Modèle ou catégorie de l'équipement"
    },
    'quantite': {
        'required': True,
        'type': 'integer',
        'example': '25000',
        'description': "Nombre d'unités de cet équipement"
    },
    'nomCourtDatacenter': {
        'required': True,
        'type': 'string',
        'example': 'DC-PARIS',
        'description': "Identifiant du datacenter hébergeant l'équipement"
    },
    
    # Informations temporelles
    'dateAchat': {
        'required': False,
        'type': 'date',
        'format': 'YYYY-MM-DD',
        'example': '2015-12-25',
        'description': "Date d'acquisition de l'équipement"
    },
    'dateRetrait': {
        'required': False,
        'type': 'date',
        'format': 'YYYY-MM-DD',
        'example': '2018-12-25',
        'description': "Date de mise hors service prévue ou effective"
    },
    'dureeUsageInterne': {
        'required': False,
        'type': 'integer',
        'example': '36',
        'description': "Durée d'utilisation interne en mois"
    },
    'dureeUsageAmont': {
        'required': False,
        'type': 'integer',
        'example': '12',
        'description': "Durée d'utilisation en amont en mois"
    },
    'dureeUsageAval': {
        'required': False,
        'type': 'integer',
        'example': '24',
        'description': "Durée d'utilisation en aval en mois"
    },
    
    # Caractéristiques de l'équipement
    'type': {
        'required': True,
        'type': 'string',
        'example': 'Ecran',
        'description': "Type d'équipement (Serveur, Ecran, PC, etc.)"
    },
    'statut': {
        'required': True,
        'type': 'string',
        'example': 'Active',
        'description': "État actuel de l'équipement (Active, Inactive, En maintenance, etc.)"
    },
    'paysDUtilisation': {
        'required': True,
        'type': 'string',
        'example': 'France',
        'description': "Pays où l'équipement est utilisé"
    },
    
    # Informations de consommation et d'utilisation
    'consoElecAnnuelle': {
        'required': False,
        'type': 'number',
        'example': '2450.75',
        'description': "Consommation électrique annuelle en kWh"
    },
    'utilisateur': {
        'required': False,
        'type': 'string',
        'example': 'Service IT',
        'description': "Service ou personne utilisant l'équipement"
    },
    'nomSourceDonnee': {
        'required': False,
        'type': 'string',
        'example': 'Inventaire 2023',
        'description': "Source des données pour cet équipement"
    },
    'nomEntite': {
        'required': False,
        'type': 'string',
        'example': 'Département Réseau',
        'description': "Entité responsable de l'équipement"
    },
    
    # Caractéristiques techniques
    'nbCoeur': {
        'required': False,
        'type': 'integer',
        'example': '16',
        'description': "Nombre de cœurs de processeur (pour serveurs/PC)"
    },
    'nbJourUtiliseAn': {
        'required': False,
        'type': 'integer',
        'example': '252',
        'description': "Nombre de jours d'utilisation par an"
    },
    'goTelecharge': {
        'required': False,
        'type': 'integer',
        'example': '5000',
        'description': "Volume de données téléchargées en Go"
    },
    
    # Modalités d'utilisation
    'modeUtilisation': {
        'required': False,
        'type': 'string',
        'example': 'Production',
        'description': "Mode d'utilisation (Production, Test, Développement, etc.)"
    },
    'tauxUtilisation': {
        'required': False,
        'type': 'number',
        'example': '0.75',
        'description': "Taux d'utilisation moyen (entre 0 et 1)"
    },
    'qualite': {
        'required': False,
        'type': 'string',
        'example': 'Haute',
        'description': "Niveau de qualité ou de performance (Haute, Moyenne, Standard, etc.)"
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
