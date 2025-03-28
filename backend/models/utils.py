import os
import datetime

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

def check_file(file_path):
    """
    Checks if the file is a CSV file or a XLSX file.
    
    Args:
        file_path (str): Path to the file to check
        
    Returns:
        tuple: (bool, str) - (valid file?, detected format or error message)
    """
    if not os.path.exists(file_path):
        return False, f"Le fichier '{file_path}' n'existe pas."

    if not os.path.isfile(file_path):
        return False, f"'{file_path}' n'est pas un fichier."

    _, extension = os.path.splitext(file_path)
    extension = extension.lower()

    if extension == '.csv':
        return True, "csv"
    elif extension == '.xlsx':
        return True, "xlsx"

    return False, f"Le fichier '{file_path}' n'est ni un CSV ni un XLSX valide."


def validate_data_type(value, expected_type):
    """
    Validates if the given value matches the expected type.
    
    Args:
        value: The value to check
        expected_type (str): One of 'string', 'integer', 'number', 'date'
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if value is None or value == "":
        return True, None  # Empty values are handled separately for required fields
        
    if expected_type == "string":
        return True, None  # Any non-empty value is valid as string
    
    elif expected_type == "integer":
        try:
            int(str(value).strip())
            return True, None
        except ValueError:
            return False, f"'{value}' n'est pas un nombre entier valide"
    
    elif expected_type == "number":
        try:
            float(str(value).strip())
            return True, None
        except ValueError:
            return False, f"'{value}' n'est pas un nombre valide"
    
    elif expected_type == "date":
        try:
            # Check if it's in YYYY-MM-DD format
            date_str = str(value).strip()
            datetime.datetime.strptime(date_str, '%Y-%m-%d')
            return True, None
        except ValueError:
            return False, f"'{value}' n'est pas au format de date valide (YYYY-MM-DD)"
    
    return False, f"Type inconnu '{expected_type}'"

def validate_columns(data, column_specs=G4IT_COLUMN_SPECS):
    """
    Validates data against column specifications.
    
    Args:
        data (list): List of dictionaries, each representing a row
        column_specs (dict): Specifications for columns with types and requirements
        
    Returns:
        dict: Validation report with errors
    """
    report = {
        "missing_required_columns": [],
        "type_errors": [],
        "is_valid": True
    }
    
    # Check if data is empty
    if not data:
        report["is_valid"] = False
        report["general_error"] = "Aucune donnée trouvée dans le fichier"
        return report
    
    # Check for missing required columns
    headers = data[0].keys()
    for column_name, specs in column_specs.items():
        if specs["required"] and column_name not in headers:
            report["missing_required_columns"].append(column_name)
            report["is_valid"] = False
    
    # Check data types for each row
    for row_idx, row in enumerate(data, 1):
        for column_name, specs in column_specs.items():
            # Skip columns not in the data
            if column_name not in row:
                continue
                
            value = row[column_name]
            
            # Skip validation for empty optional fields
            if (value is None or value == "") and not specs["required"]:
                continue
                
            # Validate required fields are not empty
            if specs["required"] and (value is None or value == ""):
                report["type_errors"].append({
                    "row": row_idx,
                    "column": column_name,
                    "error": "Valeur obligatoire manquante"
                })
                report["is_valid"] = False
                continue
            
            # Validate data type
            is_valid, error_msg = validate_data_type(value, specs["type"])
            if not is_valid:
                report["type_errors"].append({
                    "row": row_idx,
                    "column": column_name,
                    "error": error_msg
                })
                report["is_valid"] = False
    
    return report