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