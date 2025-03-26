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

@app.post("/api/load-equipment")
async def load_equipment(file_path: str = Form(...)):
    """Charge les équipements depuis un fichier validé"""
    logger.info(f"Chargement des équipements depuis {file_path}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    valid, format_or_error = check_file(file_path)
    if not valid:
        raise HTTPException(status_code=400, detail=format_or_error)
    
    handler = CsvHandler(file_path) if format_or_error == "csv" else XlsxHandler(file_path)
    
    try:
        data = handler.load_data()
        
        # Vous pourriez ajouter ici une standardisation des données côté backend
        
        return {
            "equipments": data,
            "count": len(data)
        }
    except Exception as e:
        logger.error(f"Erreur lors du chargement des équipements: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get-file-headers")
async def get_file_headers(file_path: str):
    """Récupère les en-têtes d'un fichier validé"""
    logger.info(f"Récupération des en-têtes depuis {file_path}")
    
    if not os.path.exists(file_path):
        logger.error(f"Fichier non trouvé: {file_path}")
        raise HTTPException(status_code=404, detail=f"Fichier non trouvé: {file_path}")
    
    try:
        import pandas as pd
        import io
        
        # Lire les premières lignes du fichier pour diagnostics
        with open(file_path, 'rb') as f:
            content = f.read(4096)  # Lire les premiers octets seulement
        
        logger.info(f"Contenu du fichier (premiers octets): {content[:200]}")
        
        # Détecter automatiquement le séparateur si c'est un CSV
        if file_path.lower().endsWith('.csv'):
            # Essayer différentes approches pour lire le fichier
            try:
                # Essai 1: Détection automatique
                df = pd.read_csv(file_path, engine='python', sep=None)
            except:
                try:
                    # Essai 2: Tabulation explicite
                    df = pd.read_csv(file_path, sep='\t')
                except:
                    try:
                        # Essai 3: Virgule explicite
                        df = pd.read_csv(file_path, sep=',')
                    except:
                        # Essai 4: Lecture brute et séparation manuelle
                        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                            first_line = f.readline().strip()
                        
                        if '\t' in first_line:
                            headers = first_line.split('\t')
                        else:
                            headers = first_line.split(',')
                        
                        logger.info(f"En-têtes détectés manuellement: {headers}")
                        return {
                            "headers": headers,
                            "count": len(headers),
                            "method": "manual parsing"
                        }
        elif file_path.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path)
        else:
            raise HTTPException(status_code=400, detail="Format de fichier non supporté")
        
        headers = list(df.columns)
        logger.info(f"En-têtes détectés via pandas ({len(headers)} colonnes): {headers}")
        
        # Vérifier si les en-têtes sont détectés correctement
        if len(headers) <= 1 and len(df) > 0:
            # Si une seule colonne est détectée, c'est probablement un problème de séparateur
            logger.warning("Un seul en-tête détecté, tentative de détection alternative")
            
            # Essayer de splitter la première ligne manuellement
            first_row = df.iloc[0]
            first_value = str(first_row[0])
            if '\t' in first_value:
                alt_headers = first_value.split('\t')
            elif ',' in first_value:
                alt_headers = first_value.split(',')
            else:
                alt_headers = []
            
            if len(alt_headers) > 1:
                logger.info(f"En-têtes alternatifs détectés: {alt_headers}")
                return {
                    "headers": alt_headers,
                    "count": len(alt_headers),
                    "method": "alternative parsing"
                }
        
        return {
            "headers": headers,
            "count": len(headers),
            "sample_data": df.head(3).to_dict(orient='records'),
            "method": "pandas"
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des en-têtes: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# test et debug
@app.get("/test", response_class=HTMLResponse)
async def get_test_page():
    with open("tests/test_api.html", "r") as f:
        return f.read()

@app.get("/api/debug-file")
async def debug_file(file_path: str):
    if not os.path.exists(file_path):
        return {"error": "File not found", "file_path": file_path}
    
    try:
        # Pour CSV
        if file_path.lower().endswith('.csv'):
            with open(file_path, 'r', encoding='utf-8') as f:
                first_lines = [next(f) for _ in range(5)]
                
            import pandas as pd
            try:
                df = pd.read_csv(file_path, sep=None, engine='python', nrows=3)
                headers = list(df.columns)
                sample = df.to_dict(orient='records')
            except Exception as e:
                headers = []
                sample = []
                
            return {
                "file_type": "csv",
                "first_lines": first_lines,
                "detected_headers": headers,
                "sample_data": sample
            }
        
        # Pour XLSX
        elif file_path.lower().endswith(('.xlsx', '.xls')):
            import pandas as pd
            df = pd.read_excel(file_path, nrows=3)
            
            return {
                "file_type": "xlsx",
                "detected_headers": list(df.columns),
                "sample_data": df.to_dict(orient='records')
            }
            
        else:
            return {"error": "Unsupported file type"}
            
    except Exception as e:
        return {"error": str(e)}