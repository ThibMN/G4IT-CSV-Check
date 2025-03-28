import csv as csv_module
import logging
from .utils import validate_columns, G4IT_COLUMN_SPECS

class CsvHandler:
    """Simple handler for CSV file operations.
    
    Provides methods to read, write, and append data to CSV files 
    with automatic header management.
    """
    def __init__(self, file):
        """Initializes the Csv class with a file path.

        Args:
            file (String): Path to the CSV file to be manipulated.
        """
        self.file = file

    def load_data(self):
        """Reads data from CSV file.

        Returns:
            list: List of dictionaries where each dictionary represents a row.
        """
        try:
            with open(self.file, mode='r', newline='', encoding='utf-8') as f:
                reader = csv_module.DictReader(f)
                return list(reader)
        except FileNotFoundError:
            print(f"Erreur: Le fichier '{self.file}' est introuvable.")
            return []
        except PermissionError:
            print(f"Erreur: Pas d'autorisation pour accéder au fichier '{self.file}'.")
            return []
        except UnicodeDecodeError:
            print(f"Erreur: Problème d'encodage lors de la lecture du fichier '{self.file}'.")
            return []
        except Exception as e:
            print(f"Erreur inattendue lors du chargement du fichier '{self.file}': {str(e)}")
            return []
        
    def write_data(self, data, header=None):
        """Writes data to CSV file.

        Args:
            data (list): List of dictionaries to write.
            header (list, optional): Column headers. Defaults to None.
        """
        try:
            with open(self.file, mode='w', newline='', encoding='utf-8') as f:
                if header is None:
                    header = data[0].keys() if data else []
                
                writer = csv_module.DictWriter(f, fieldnames=header)
                writer.writeheader()
                writer.writerows(data)
        except PermissionError:
            print(f"Erreur: Pas d'autorisation pour modifier le fichier '{self.file}'.")
        except IOError as e:
            print(f"Erreur d'entrée/sortie lors de l'écriture dans '{self.file}': {str(e)}")
        except Exception as e:
            print(f"Erreur inattendue lors de la modification des données dans '{self.file}': {str(e)}")

    def append_row(self, line):
        """Appends a single line (row) to CSV file.

        Args:
            line (dict): Dictionary representing a row to add.
        """
        try:
            with open(self.file, mode='a', newline='', encoding='utf-8') as f:
                writer = csv_module.DictWriter(f, fieldnames=line.keys())
                if f.tell() == 0:  # If file is empty, write header
                    writer.writeheader()
                writer.writerow(line)
        except PermissionError:
            print(f"Erreur: Pas d'autorisation pour modifier le fichier '{self.file}'.")
        except IOError as e:
            print(f"Erreur d'entrée/sortie lors de l'ajout de ligne dans '{self.file}': {str(e)}")
        except Exception as e:
            print(f"Erreur inattendue lors de l'ajout de ligne dans '{self.file}': {str(e)}")


    def validate_dates(self, date_column):
        """
        Checks if dates in CSV are in correct mm-dd-yyyy format.
        
        Args:
            date_column (str): Name of the column containing dates
            
        Returns:
            bool: True if dates need switching (month > 12 found), False otherwise
        """
        data = self.load_data()
        invalid_rows = []
        
        for i, row in enumerate(data, 1):
            if date_column not in row:
                raise KeyError(f"La colonne '{date_column}' est absente du fichier CSV. Vérifiez l'orthographe ou les en-têtes du fichier.")
            
            date_value = row[date_column]
            
            # Skip empty values
            if not date_value:
                invalid_rows.append(f"Ligne {i}: valeur de date manquante")
                continue
                
            try:
                if '/' in date_value:
                    month, day, year = map(int, date_value.split('/'))
                else:
                    month, day, year = map(int, date_value.split('-'))
                if month > 12:
                    print(f"Format de date inversé détecté à la ligne {i}: {date_value} (mois={month} > 12)")
                    return True
            except ValueError:
                invalid_rows.append(f"Ligne {i}: format de date invalide '{date_value}' (doit être JJ-MM-AAAA ou MM-JJ-AAAA)")
                continue
            except AttributeError:
                invalid_rows.append(f"Ligne {i}: type de donnée invalide pour la date '{type(date_value)}'")
                continue

        if invalid_rows:
            print(f"Attention: {len(invalid_rows)} lignes avec des dates non valides trouvées:")
            for msg in invalid_rows[:5]:
                print(f"  - {msg}")
            if len(invalid_rows) > 5:
                print(f"  ... et {len(invalid_rows)-5} autres problèmes.")

        return False

    def fix_dates(self, date_column):
        """
        Fixes dates by switching month and day if month > 12.
        Also standardizes separator to hyphen.
        
        Args:
            date_column (str): Name of the column containing dates

        Returns:
            list: Corrected data with fixed dates
        """
        data = self.load_data()
        unfixable_rows = []
        fixed_count = 0

        for i, row in enumerate(data, 1):
            if date_column not in row:
                raise KeyError(f"La colonne '{date_column}' est absente du fichier CSV. Impossible de corriger les dates.")

            date_value = row[date_column]

            # Skip empty values
            if not date_value:
                continue

            try:
                if '/' in date_value:
                    month, day, year = map(int, date_value.split('/'))
                    separator_fixed = True
                else:
                    month, day, year = map(int, date_value.split('-'))
                    separator_fixed = False
                    
                if month > 12:
                    # Swap month and day and standardize to hyphen
                    row[date_column] = f"{day:02d}-{month:02d}-{year}"
                    fixed_count += 1
                    print(f"Corrigé: '{date_value}' → '{row[date_column]}' (ligne {i})")
                elif separator_fixed:
                    # Standardize to hyphen without swapping
                    row[date_column] = f"{month:02d}-{day:02d}-{year}"
                    print(f"Normalisé: '{date_value}' → '{row[date_column]}' (ligne {i})")
            except ValueError:
                unfixable_rows.append(f"Ligne {i}: impossible de parser '{date_value}'")
                continue
            except AttributeError:
                unfixable_rows.append(f"Ligne {i}: type de donnée invalide pour la date '{type(date_value)}'")
                continue
        
        if unfixable_rows:
            print(f"\nAttention: {len(unfixable_rows)} lignes n'ont pas pu être corrigées:")
            for msg in unfixable_rows[:5]:
                print(f"  - {msg}")
            if len(unfixable_rows) > 5:
                print(f"  ... et {len(unfixable_rows)-5} autres problèmes.")
        
        print(f"\nRésumé: {fixed_count} dates inversées corrigées, {len(unfixable_rows)} lignes non traitables.")
        return data

    def validate_columns(self, column_specs=None):
        """
        Validates that the CSV file contains all required columns 
        with correct data types.
        
        Args:
            column_specs (dict, optional): Column specifications. 
                                          Defaults to G4IT_COLUMN_SPECS.
        
        Returns:
            dict: Validation report with errors and overall validity
        """
        try:
            data = self.load_data()
            if not data:
                return {
                    "is_valid": False,
                    "general_error": f"Impossible de charger les données du fichier '{self.file}'"
                }
                
            specs = column_specs if column_specs else G4IT_COLUMN_SPECS
            report = validate_columns(data, specs)
            
            # Print summary
            if report["is_valid"]:
                print(f"Validation réussie: Le fichier '{self.file}' respecte les spécifications.")
            else:
                print(f"Validation échouée: Le fichier '{self.file}' contient des erreurs:")
                
                if report.get("missing_required_columns"):
                    print(f"  - Colonnes obligatoires manquantes: {', '.join(report['missing_required_columns'])}")
                
                if report.get("type_errors"):
                    print(f"  - {len(report['type_errors'])} erreurs de type de données:")
                    for i, error in enumerate(report["type_errors"][:5]):
                        print(f"    * Ligne {error['row']}, colonne '{error['column']}': {error['error']}")
                    if len(report["type_errors"]) > 5:
                        print(f"    * ... et {len(report['type_errors'])-5} autres erreurs.")
            
            return report
            
        except Exception as e:
            return {
                "is_valid": False,
                "general_error": f"Erreur lors de la validation: {str(e)}"
            }
            
    def get_headers(self):
        try:
            # Détecter le délimiteur
            with open(self.file, 'r', encoding='utf-8', errors='replace') as f:
                first_line = f.readline().strip()
                delimiter = ';' if ';' in first_line else ','
            
            # Lire les en-têtes avec le bon délimiteur
            with open(self.file, 'r', encoding='utf-8', errors='replace') as f:
                reader = csv_module.reader(f, delimiter=delimiter)
                headers = next(reader)  # Prendre la première ligne
                return [h.strip() for h in headers]  # Nettoyer les espaces
        except Exception as e:
            logging.error(f"Erreur lors de la lecture des en-têtes CSV: {str(e)}")
            raise ValueError(f"Format CSV invalide: {str(e)}")