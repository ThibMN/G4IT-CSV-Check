from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from typing import Optional
import tempfile
import os
import uuid
import logging
from models import CsvHandler, XlsxHandler, check_file, validate_columns, G4IT_COLUMN_SPECS

# Configurer le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configurer CORS pour permettre les requêtes du front-end
origins = [
    "http://localhost:3000",    # URL du frontend Next.js
    "http://127.0.0.1:3000",    # Alternative
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dossier pour stocker temporairement les fichiers
TEMP_DIR = tempfile.gettempdir()

@app.get("/")
def read_root():
    return {"message": "G4IT CSV Checker API is running"}

@app.get("/api/data")
def read_data():
    return {"message": "Hello from FastAPI"}

@app.post("/api/validate-file")
async def validate_file(file: UploadFile = File(...)):
    """Valide un fichier CSV ou XLSX"""
    logger.info(f"Réception du fichier: {file.filename}")
    
    # Sauvegarde temporaire du fichier
    file_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_{file.filename}")
    logger.info(f"Sauvegarde temporaire: {file_path}")
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Vérification du type de fichier
    logger.info("Vérification du type de fichier...")
    valid, format_or_error = check_file(file_path)
    if not valid:
        os.remove(file_path)
        logger.error(f"Fichier invalide: {format_or_error}")
        raise HTTPException(status_code=400, detail=format_or_error)
    
    # Validation des colonnes selon le format
    logger.info(f"Validation des colonnes ({format_or_error})...")
    handler = CsvHandler(file_path) if format_or_error == "csv" else XlsxHandler(file_path)
    validation_report = handler.validate_columns()
    
    # Ajout du chemin temporaire au rapport pour référence future
    validation_report["temp_file_path"] = file_path
    validation_report["original_filename"] = file.filename
    validation_report["file_format"] = format_or_error
    
    logger.info(f"Validation terminée: {validation_report['is_valid']}")
    return validation_report

@app.post("/api/fix-dates")
async def fix_dates(file_path: str = Form(...), date_column: str = Form(...)):
    """Corrige les formats de date dans une colonne spécifique"""
    logger.info(f"Correction des dates pour {file_path}, colonne {date_column}")
    
    valid, format_or_error = check_file(file_path)
    if not valid:
        logger.error(f"Fichier invalide: {format_or_error}")
        raise HTTPException(status_code=400, detail=format_or_error)
    
    handler = CsvHandler(file_path) if format_or_error == "csv" else XlsxHandler(file_path)
    
    try:
        # Corriger les dates
        logger.info("Début de la correction des dates...")
        corrected_data = handler.fix_dates(date_column)
        
        # Sauvegarder le fichier corrigé
        corrected_file_path = os.path.join(TEMP_DIR, f"corrected_{os.path.basename(file_path)}")
        logger.info(f"Sauvegarde du fichier corrigé: {corrected_file_path}")
        
        if format_or_error == "csv":
            CsvHandler(corrected_file_path).write_data(corrected_data)
        else:
            XlsxHandler(corrected_file_path).write_data(corrected_data)
            
        return {
            "success": True,
            "corrected_file_path": corrected_file_path,
            "message": f"Les dates de la colonne '{date_column}' ont été corrigées"
        }
    except Exception as e:
        logger.error(f"Erreur lors de la correction des dates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/download-processed-file")
async def download_processed_file(file_path: str = Form(...)):
    """Télécharge un fichier traité"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    return FileResponse(
        path=file_path, 
        filename=os.path.basename(file_path),
        media_type="application/octet-stream"
    )

@app.delete("/api/cleanup")
async def cleanup_temp_file(file_path: str = Form(...)):
    """Supprime un fichier temporaire"""
    if os.path.exists(file_path) and file_path.startswith(TEMP_DIR):
        os.remove(file_path)
        return {"success": True, "message": "Fichier temporaire supprimé"}
    return {"success": False, "message": "Fichier non trouvé ou chemin non autorisé"}

@app.get("/api/column-specs")
def get_column_specs():
    """Retourne les spécifications de colonnes utilisées pour la validation"""
    return G4IT_COLUMN_SPECS

# test et debug
@app.get("/test", response_class=HTMLResponse)
async def get_test_page():
    with open("tests/test_api.html", "r") as f:
        return f.read()