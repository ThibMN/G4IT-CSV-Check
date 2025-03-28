# G4IT-CSV-Check 📊

A comprehensive web application for validating, consolidating, and analyzing IT equipment inventories to evaluate their environmental impact.

## ✨ Features

* **CSV/Excel file validation** to ensure data quality and completeness
* **Automatic error detection** with classification into critical and minor issues
* **Interactive error correction** with suggestions for fixing common problems
* **Equipment consolidation** to group similar items and calculate accurate quantities
* **Export functionality** supporting both CSV and Excel formats
* **Export history tracking** to maintain records of all generated reports
* **Modern responsive interface** built with Next.js and Tailwind CSS
* **Real-time validation feedback** for immediate data quality assessment
* **Detailed equipment inventory view** with filtering and search capabilities
* **Environmental impact preparation** by standardizing data for analysis tools

## 🚀 Installation

### Prerequisites

* Node.js v18+ for the frontend
* Python 3.9+ for the backend
* pip (Python package manager)

### Setting up the project

1. Clone the repository:
```bash
git clone https://github.com/yourusername/G4IT-CSV-Check.git
cd G4IT-CSV-Check
```

2. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

The application uses default configuration for development environments:

* Backend API runs on `http://localhost:8001`
* Frontend application runs on `http://localhost:3000`

You can modify these settings in:
- Backend: `backend/main.py` (CORS settings)
- Frontend: Environment variables or directly in API route files

## 🛠️ Available Commands

### Starting the application

For convenience, you can use the start-all script (Linux/macOS):
```bash
./scripts/start-all.sh
```

Or start each component separately:

#### Backend
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8001
```

#### Frontend
```bash
cd frontend
npm run dev
```

The application will be available at http://localhost:3000

### Production

To create an optimized production build for the frontend:
```bash
cd frontend
npm run build
npm run start
```

## 🔧 Technologies

### Frontend
* Next.js 15
* React 19
* TypeScript
* Tailwind CSS
* Zustand for state management
* Axios for API requests
* Papa Parse for CSV processing
* XLSX for Excel file handling

### Backend
* FastAPI
* Python 3.9+
* Pandas for data processing
* OpenPyXL for Excel file handling

## 📋 Data Flow

1. User uploads CSV/Excel inventory file
2. Backend validates file format and structure
3. Data is processed and errors are identified
4. User corrects errors through the interface
5. Equipment items are consolidated based on similar characteristics
6. Consolidated data can be exported in CSV or Excel format
7. Export history is maintained for reference

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
