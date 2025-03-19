import os

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