import csv

class Csv:
    def __init__(self, file):
        """Initializes the Csv class with a file path."""
        self.file = file

    def read(self):
        """Reads the CSV file and returns a list of dictionaries."""
        with open(self.file, mode='r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)
        
    def write(self, data, header=None):
        """Writes a dictionnary list to the CSV file."""
        with open(self.file, mode='w', newline='', encoding='utf-8') as f:
            if header is None:
                header = data[0].keys() if data else []
            
            writer = csv.DictWriter(f, fieldnames=header)
            writer.writeheader()
            writer.writerows(data)

    def add(self, line):
        """Adds a line to the CSV file."""
        with open(self.file, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=line.keys())
            if f.tell() == 0:  # If file is empty, write header
                writer.writeheader()
            writer.writerow(line)