import csv as csv_module

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
        with open(self.file, mode='r', newline='', encoding='utf-8') as f:
            reader = csv_module.DictReader(f)
            return list(reader)
        
    def write_data(self, data, header=None):
        """Writes data to CSV file.

        Args:
            data (list): List of dictionaries to write.
            header (list, optional): Column headers. Defaults to None.
        """
        with open(self.file, mode='w', newline='', encoding='utf-8') as f:
            if header is None:
                header = data[0].keys() if data else []
            
            writer = csv_module.DictWriter(f, fieldnames=header)
            writer.writeheader()
            writer.writerows(data)

    def append_row(self, line):
        """Appends a single line (row) to CSV file.

        Args:
            line (dict): Dictionary representing a row to add.
        """
        with open(self.file, mode='a', newline='', encoding='utf-8') as f:
            writer = csv_module.DictWriter(f, fieldnames=line.keys())
            if f.tell() == 0:  # If file is empty, write header
                writer.writeheader()
            writer.writerow(line)

    def validate_dates(self, date_column):
        """
        Checks if dates in CSV are in correct mm-dd-yyyy format.
        
        Args:
            date_column (str): Name of the column containing dates
            
        Returns:
            bool: True if dates need switching (month > 12 found), False otherwise
        """
        data = self.load_data()
        
        for row in data:
            if date_column not in row:
                raise KeyError(f"Column '{date_column}' not found in CSV")
            
            try:
                if '/' in row[date_column]:
                    month, day, year = map(int, row[date_column].split('/'))
                else:
                    month, day, year = map(int, row[date_column].split('-'))
                if month > 12:
                    return True
            except (ValueError, AttributeError):
                continue
                
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
        
        for row in data:
            try:
                if '/' in row[date_column]:
                    month, day, year = map(int, row[date_column].split('/'))
                else:
                    month, day, year = map(int, row[date_column].split('-'))
                    
                if month > 12:
                    # Swap month and day and standardize to hyphen
                    row[date_column] = f"{year}-{day:02d}-{month:02d}"
                else:
                    # Standardize to hyphen without swapping
                    row[date_column] = f"{year}-{month:02d}-{day:02d}"
            except (ValueError, AttributeError):
                continue
        
        return data
    def count_models(self):
        """
        Counts the number of unique models in the CSV file.
        
        Returns:
            int: Number of unique models
        """
        data = self.load_data()
        models = set(row['modele'] for row in data)
        dict_models = {model: 0 for model in models}
        for row in data:
            if row['modele'] in dict_models:
                dict_models[row['modele']] += 1
        return dict_models