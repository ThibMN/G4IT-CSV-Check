from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from typing import Optional
import tempfile
import os
import uuid
import logging
from models import CsvHandler, XlsxHandler, check_file, validate_columns, G4IT_COLUMN_SPECS
import json
import pandas as pd
from fastapi import Request
from datetime import datetime

# Configurer le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Créer le répertoire temporaire s'il n'existe pas
TEMP_DIR = os.path.join(tempfile.gettempdir(), "g4it_csv_check")
os.makedirs(TEMP_DIR, exist_ok=True)

app = FastAPI(title="G4IT CSV Check API", 
              description="API pour valider et traiter les fichiers CSV/Excel pour G4IT",
              version="1.0.0")

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

# Modèles Pydantic pour la validation des entrées
class CorrectionItem(BaseModel):
    column: str
    row: int
    value: str
    correction: str
    
    @validator('row')
    def validate_row(cls, v):
        if v < 0:
            raise ValueError("Le numéro de ligne doit être positif")
        return v

class CorrectionsRequest(BaseModel):
    file_path: str
    corrections: List[CorrectionItem]
    
    @validator('file_path')
    def validate_file_path(cls, v):
        if not os.path.exists(v):
            raise ValueError(f"Le fichier {v} n'existe pas")
        return v

class MappingRequest(BaseModel):
    file_path: str
    mapping: Dict[str, str]
    
    @validator('file_path')
    def validate_file_path(cls, v):
        if not os.path.exists(v):
            raise ValueError(f"Le fichier {v} n'existe pas")
        return v

# Fonction de dépendance pour vérifier l'existence d'un fichier
async def verify_file_exists(file_path: str = Form(...)):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Fichier temporaire non trouvé")
    return file_path

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API G4IT CSV Check"}

@app.post("/api/validate-file", status_code=200)
async def validate_file(file: UploadFile = File(...)):
    """Valide un fichier CSV ou XLSX"""
    try:
        logger.info(f"Réception du fichier: {file.filename}")
        
        # Vérifier l'extension du fichier
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ['.csv', '.xlsx', '.xls']:
            raise HTTPException(
                status_code=400, 
                detail="Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx/.xls)"
            )
        
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
    except HTTPException:
        # Relancer les exceptions HTTP déjà formatées
        raise
    except Exception as e:
        logger.error(f"Erreur inattendue lors de la validation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la validation: {str(e)}")

@app.post("/api/fix-dates", status_code=200)
async def fix_dates(
    file_path: str = Depends(verify_file_exists), 
    date_column: str = Form(...)
):
    """Corrige les formats de date dans une colonne spécifique"""
    try:
        logger.info(f"Correction des dates pour {file_path}, colonne {date_column}")
        
        valid, format_or_error = check_file(file_path)
        if not valid:
            logger.error(f"Fichier invalide: {format_or_error}")
            raise HTTPException(status_code=400, detail=format_or_error)
        
        handler = CsvHandler(file_path) if format_or_error == "csv" else XlsxHandler(file_path)
        
        # Vérifier si la colonne existe
        if not handler.column_exists(date_column):
            raise HTTPException(
                status_code=400, 
                detail=f"La colonne '{date_column}' n'existe pas dans le fichier"
            )
        
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la correction des dates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la correction des dates: {str(e)}")

@app.post("/api/correct-error", status_code=200)
async def correct_error(
    file_path: str = Depends(verify_file_exists),
    column: str = Form(...),
    row: int = Form(...),
    value: str = Form(...),
    correction: str = Form(...)
):
    """Corrige une erreur spécifique dans le fichier"""
    try:
        # Vérifier si le numéro de ligne est valide
        if row < 0:
            raise HTTPException(status_code=400, detail="Le numéro de ligne doit être positif")
        
        # Déterminer le format du fichier
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.csv':
            # Traitement pour CSV
            df = pd.read_csv(file_path, sep=';', encoding='utf-8')
            
            # Vérifier si la colonne existe
            if column not in df.columns:
                raise HTTPException(status_code=400, detail=f"Colonne '{column}' non trouvée dans le fichier")
            
            # Vérifier si la ligne existe
            if row >= len(df):
                raise HTTPException(status_code=400, detail=f"Ligne {row} non trouvée dans le fichier")
            
            # Appliquer la correction
            df.at[row, column] = correction
            
            # Sauvegarder le fichier modifié
            df.to_csv(file_path, sep=';', index=False, encoding='utf-8')
            
        elif file_extension in ['.xlsx', '.xls']:
            # Traitement pour Excel
            df = pd.read_excel(file_path)
            
            # Vérifier si la colonne existe
            if column not in df.columns:
                raise HTTPException(status_code=400, detail=f"Colonne '{column}' non trouvée dans le fichier")
            
            # Vérifier si la ligne existe
            if row >= len(df):
                raise HTTPException(status_code=400, detail=f"Ligne {row} non trouvée dans le fichier")
            
            # Appliquer la correction
            df.at[row, column] = correction
            
            # Sauvegarder le fichier modifié
            df.to_excel(file_path, index=False)
        else:
            raise HTTPException(status_code=400, detail="Format de fichier non supporté")
        
        return {
            "success": True,
            "message": f"Correction appliquée avec succès à la ligne {row}, colonne '{column}'"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la correction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la correction: {str(e)}")

@app.post("/api/apply-mapping", status_code=200)
async def apply_mapping(request: Request):
    """Applique un mapping de colonnes à un fichier"""
    try:
        data = await request.json()
        file_path = data.get("file_path")
        mapping = data.get("mapping", {})
        
        # Validation des entrées
        if not file_path:
            raise HTTPException(status_code=400, detail="Chemin du fichier manquant")
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Fichier temporaire non trouvé")
        
        if not mapping:
            raise HTTPException(status_code=400, detail="Mapping de colonnes vide")
        
        # Déterminer le format du fichier
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.csv':
            # Traitement pour CSV
            df = pd.read_csv(file_path, sep=';', encoding='utf-8')
            
            # Appliquer le mapping (renommer les colonnes)
            column_mapping = {}
            for index, target_column in mapping.items():
                if int(index) < len(df.columns):
                    column_mapping[df.columns[int(index)]] = target_column
            
            # Vérifier si le mapping est valide
            if not column_mapping:
                raise HTTPException(status_code=400, detail="Aucune colonne n'a pu être mappée")
            
            df = df.rename(columns=column_mapping)
            
            # Sauvegarder le fichier modifié
            df.to_csv(file_path, sep=';', index=False, encoding='utf-8')
            
        elif file_extension in ['.xlsx', '.xls']:
            # Traitement pour Excel
            df = pd.read_excel(file_path)
            
            # Appliquer le mapping (renommer les colonnes)
            column_mapping = {}
            for index, target_column in mapping.items():
                if int(index) < len(df.columns):
                    column_mapping[df.columns[int(index)]] = target_column
            
            # Vérifier si le mapping est valide
            if not column_mapping:
                raise HTTPException(status_code=400, detail="Aucune colonne n'a pu être mappée")
            
            df = df.rename(columns=column_mapping)
            
            # Sauvegarder le fichier modifié
            df.to_excel(file_path, index=False)
        else:
            raise HTTPException(status_code=400, detail="Format de fichier non supporté")
        
        # Extraire les données après le mapping pour les renvoyer au frontend
        processed_data = df.to_dict(orient='records')
        
        return {
            "success": True,
            "message": "Mapping appliqué avec succès",
            "processed_data": processed_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'application du mapping: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'application du mapping: {str(e)}")

@app.post("/api/apply-corrections", status_code=200)
async def apply_corrections(request: Request):
    """Applique toutes les corrections et génère un fichier corrigé"""
    try:
        data = await request.json()
        file_path = data.get("file_path")
        corrections = data.get("corrections", [])
        
        # Validation des entrées
        if not file_path:
            raise HTTPException(status_code=400, detail="Chemin du fichier manquant")
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Fichier temporaire non trouvé")
        
        if not corrections:
            raise HTTPException(status_code=400, detail="Aucune correction fournie")
        
        # Déterminer le format du fichier
        file_extension = os.path.splitext(file_path)[1].lower()
        
        # Créer un nouveau nom de fichier pour la version corrigée
        corrected_file_path = file_path.replace(file_extension, f"_corrected{file_extension}")
        
        if file_extension == '.csv':
            # Traitement pour CSV
            df = pd.read_csv(file_path, sep=';', encoding='utf-8')
            
            # Appliquer toutes les corrections
            for correction in corrections:
                column = correction.get("column")
                row = correction.get("row")
                new_value = correction.get("correction")
                
                # Validation des données de correction
                if not column or row is None or new_value is None:
                    continue
                
                if column not in df.columns:
                    logger.warning(f"Colonne '{column}' non trouvée, correction ignorée")
                    continue
                
                if row < 0 or row >= len(df):
                    logger.warning(f"Ligne {row} hors limites, correction ignorée")
                    continue
                
                df.at[row, column] = new_value
            
            # Sauvegarder le fichier corrigé
            df.to_csv(corrected_file_path, sep=';', index=False, encoding='utf-8')
            
        elif file_extension in ['.xlsx', '.xls']:
            # Traitement pour Excel
            df = pd.read_excel(file_path)
            
            # Appliquer toutes les corrections
            for correction in corrections:
                column = correction.get("column")
                row = correction.get("row")
                new_value = correction.get("correction")
                
                # Validation des données de correction
                if not column or row is None or new_value is None:
                    continue
                
                if column not in df.columns:
                    logger.warning(f"Colonne '{column}' non trouvée, correction ignorée")
                    continue
                
                if row < 0 or row >= len(df):
                    logger.warning(f"Ligne {row} hors limites, correction ignorée")
                    continue
                
                df.at[row, column] = new_value
            
            # Sauvegarder le fichier corrigé
            df.to_excel(corrected_file_path, index=False)
        else:
            raise HTTPException(status_code=400, detail="Format de fichier non supporté")
        
        return {
            "success": True,
            "message": f"{len(corrections)} corrections appliquées avec succès",
            "corrected_file_path": corrected_file_path
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'application des corrections: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'application des corrections: {str(e)}")

# Nouvel endpoint pour récupérer les données d'un fichier après mapping
@app.get("/api/get-file-data", status_code=200)
async def get_file_data(file_path: str):
    """Récupère les données d'un fichier après mapping"""
    try:
        # Vérifier si le fichier existe
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Fichier temporaire non trouvé")
        
        # Déterminer le format du fichier
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.csv':
            # Traitement pour CSV
            df = pd.read_csv(file_path, sep=';', encoding='utf-8')
        elif file_extension in ['.xlsx', '.xls']:
            # Traitement pour Excel
            df = pd.read_excel(file_path)
        else:
            raise HTTPException(status_code=400, detail="Format de fichier non supporté")
        
        # Convertir les données en format JSON
        data = df.to_dict(orient='records')
        
        return {
            "success": True,
            "data": data,
            "columns": df.columns.tolist()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des données: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des données: {str(e)}")

# Nouvel endpoint pour consolider les équipements
@app.post("/api/consolidate-equipments", status_code=200)
async def consolidate_equipments(request: Request):
    """Consolide les équipements par modèle"""
    try:
        data = await request.json()
        file_path = data.get("file_path")
        group_by_fields = data.get("group_by_fields", ["modele", "type"])
        
        # Validation des entrées
        if not file_path and not data.get("equipments"):
            raise HTTPException(
                status_code=400, 
                detail="Vous devez fournir soit un chemin de fichier, soit une liste d'équipements"
            )
        
        # Si un chemin de fichier est fourni, charger les données depuis le fichier
        if file_path:
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail="Fichier temporaire non trouvé")
            
            # Déterminer le format du fichier
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.csv':
                # Traitement pour CSV
                df = pd.read_csv(file_path, sep=';', encoding='utf-8')
            elif file_extension in ['.xlsx', '.xls']:
                # Traitement pour Excel
                df = pd.read_excel(file_path)
            else:
                raise HTTPException(status_code=400, detail="Format de fichier non supporté")
        else:
            # Utiliser les équipements fournis directement
            equipments = data.get("equipments", [])
            df = pd.DataFrame(equipments)
        
        # Vérifier si les champs de regroupement existent
        for field in group_by_fields:
            if field not in df.columns:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Le champ '{field}' n'existe pas dans les données"
                )
        
        # Consolider les équipements
        consolidated = []
        
        # Regrouper par les champs spécifiés
        grouped = df.groupby(group_by_fields)
        
        for name, group in grouped:
            # Créer un dictionnaire pour l'équipement consolidé
            consolidated_equipment = {}
            
            # Ajouter les champs de regroupement
            if isinstance(name, tuple):
                for i, field in enumerate(group_by_fields):
                    consolidated_equipment[field] = name[i]
            else:
                consolidated_equipment[group_by_fields[0]] = name
            
            # Ajouter les autres champs (prendre la première valeur)
            for column in df.columns:
                if column not in group_by_fields and column not in consolidated_equipment:
                    # Pour les champs numériques, prendre la somme
                    if pd.api.types.is_numeric_dtype(df[column]):
                        consolidated_equipment[column] = group[column].sum()
                    else:
                        # Pour les autres champs, prendre la valeur la plus fréquente
                        consolidated_equipment[column] = group[column].mode().iloc[0] if not group[column].mode().empty else None
            
            # Ajouter la quantité (nombre d'équipements dans le groupe)
            consolidated_equipment["quantite"] = len(group)
            
            consolidated.append(consolidated_equipment)
        
        return {
            "success": True,
            "consolidated_equipments": consolidated
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la consolidation des équipements: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la consolidation des équipements: {str(e)}")

# Nouvel endpoint pour exporter les données
@app.post("/api/export-data", status_code=200)
async def export_data(request: Request):
    """Exporte les données au format CSV ou XLSX"""
    try:
        data = await request.json()
        format = data.get("format", "csv")
        file_path = data.get("file_path")
        equipments = data.get("equipments")
        
        # Validation des entrées
        if not file_path and not equipments:
            raise HTTPException(
                status_code=400, 
                detail="Vous devez fournir soit un chemin de fichier, soit une liste d'équipements"
            )
        
        if format not in ["csv", "xlsx"]:
            raise HTTPException(
                status_code=400, 
                detail="Format d'exportation non supporté. Utilisez 'csv' ou 'xlsx'"
            )
        
        # Si un chemin de fichier est fourni, charger les données depuis le fichier
        if file_path:
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail="Fichier temporaire non trouvé")
            
            # Déterminer le format du fichier
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.csv':
                # Traitement pour CSV
                df = pd.read_csv(file_path, sep=';', encoding='utf-8')
            elif file_extension in ['.xlsx', '.xls']:
                # Traitement pour Excel
                df = pd.read_excel(file_path)
            else:
                raise HTTPException(status_code=400, detail="Format de fichier non supporté")
        else:
            # Utiliser les équipements fournis directement
            df = pd.DataFrame(equipments)
        
        # Générer un nom de fichier unique pour l'export
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_filename = f"export_{timestamp}.{format}"
        export_path = os.path.join(TEMP_DIR, export_filename)
        
        # Exporter les données
        if format == "csv":
            df.to_csv(export_path, sep=';', index=False, encoding='utf-8')
        else:  # xlsx
            df.to_excel(export_path, index=False)
        
        return {
            "success": True,
            "message": f"Données exportées avec succès au format {format.upper()}",
            "filename": export_filename,
            "file_path": export_path
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'exportation des données: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'exportation des données: {str(e)}")

# Endpoint pour télécharger un fichier exporté
@app.get("/api/download/{filename}", status_code=200)
async def download_file(filename: str):
    """Télécharge un fichier exporté"""
    try:
        file_path = os.path.join(TEMP_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement du fichier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du téléchargement du fichier: {str(e)}")

# Endpoint pour nettoyer les fichiers temporaires
@app.post("/api/cleanup", status_code=200)
async def cleanup_temp_files():
    """Nettoie les fichiers temporaires"""
    try:
        # Supprimer tous les fichiers du répertoire temporaire
        for filename in os.listdir(TEMP_DIR):
            file_path = os.path.join(TEMP_DIR, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
        
        return {
            "success": True,
            "message": "Fichiers temporaires nettoyés avec succès"
        }
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des fichiers temporaires: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erreur lors du nettoyage des fichiers temporaires: {str(e)}"
        )