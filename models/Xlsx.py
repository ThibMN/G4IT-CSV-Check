import openpyxl

class XlsxHandler:
    """Simple handler for XLSX file operations.
    
    Provides methods to read, write, and append data to XLSX files 
    with automatic header management.
    """
    def __init__(self, file):
        """Initializes the Xlsx class with a file path.

        Args:
            file (String): Path to the XLSX file to be manipulated.
        """
        self.file = file

    def load_data(self):
        """Reads data from XLSX file.

        Returns:
            list: List of dictionaries where each dictionary represents a row.
        """
        wb = openpyxl.load_workbook(self.file)
        sheet = wb.active
        data = []
        headers = [cell.value for cell in sheet[1]]
        for row in sheet.iter_rows(min_row=2, values_only=True):
            data.append(dict(zip(headers, row)))
        return data
        
    def write_data(self, data, header=None):
        """Writes data to XLSX file.

        Args:
            data (list): List of dictionaries to write.
            header (list, optional): Column headers. Defaults to None.
        """
        wb = openpyxl.Workbook()
        sheet = wb.active
        if header is None:
            header = data[0].keys() if data else []
        sheet.append(header)
        for row in data:
            sheet.append([row.get(col) for col in header])
        wb.save(self.file)

    def append_row(self, line):
        """Appends a single line (row) to XLSX file.

        Args:
            line (dict): Dictionary representing a row to add.
        """
        try:
            wb = openpyxl.load_workbook(self.file)
            sheet = wb.active
        except FileNotFoundError:
            wb = openpyxl.Workbook()
            sheet = wb.active
            sheet.append(line.keys())  # Write header if file does not exist

        sheet.append(line.values())
        wb.save(self.file)