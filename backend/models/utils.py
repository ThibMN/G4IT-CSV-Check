import os
import datetime

G4IT_COLUMN_SPECS = {
    "nomEquipementPhysique": {"required": True, "type": "string"},
    "modele": {"required": True, "type": "string"},
    "quantite": {"required": True, "type": "integer"},
    "nomCourtDatacenter": {"required": True, "type": "string"},
    "dateAchat": {"required": False, "type": "date"},
    "dateRetrait": {"required": False, "type": "date"},
    "dureeUsageInterne": {"required": False, "type": "integer"},
    "dureeUsageAmont": {"required": False, "type": "integer"},
    "dureeUsageAval": {"required": False, "type": "integer"},
    "type": {"required": True, "type": "string"},
    "statut": {"required": True, "type": "string"},
    "paysDUtilisation": {"required": True, "type": "string"},
    "consoElecAnnuelle": {"required": False, "type": "number"},
    "utilisateur": {"required": False, "type": "string"},
    "nomSourceDonnee": {"required": False, "type": "string"},
    "nomEntite": {"required": False, "type": "string"},
    "nbCoeur": {"required": False, "type": "integer"},
    "nbJourUtiliseAn": {"required": False, "type": "integer"},
    "goTelecharge": {"required": False, "type": "integer"},
    "modeUtilisation": {"required": False, "type": "string"},
    "tauxUtilisation": {"required": False, "type": "number"},
    "qualite": {"required": False, "type": "string"}
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