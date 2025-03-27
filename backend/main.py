from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from typing import Optional
import tempfile
import os
import uuid
import logging
import csv
import pandas as pd
from models import CsvHandler, XlsxHandler, check_file, validate_columns, G4IT_COLUMN_SPECS
from datetime import datetime

# Configurer le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configurer CORS pour permettre les requêtes du front-end
origins = [
    "http://localhost:3000",    # URL du frontend Next.js
    "http://127.0.0.1:3000",    # Alternative
    "http://localhost:3001",    # Port alternatif de Next.js
    "http://127.0.0.1:3001",    # Alternative
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
    """
    Valide un fichier téléchargé et retourne les problèmes détectés.
    """
    try:
        logger.info(f"Fichier reçu: {file.filename}")

        # Vérifier l'extension du fichier
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nom de fichier manquant")

        # Sauvegarder temporairement le fichier
        file_path = os.path.join(TEMP_DIR, f"upload_{uuid.uuid4()}{os.path.splitext(file.filename)[1]}")
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        # Déterminer le type de fichier
        file_extension = os.path.splitext(file.filename)[1].lower()

        detected_columns = []
        # Colonnes obligatoires dans les fichiers CSV G4IT
        required_columns = [
            'nomEquipementPhysique',  # Nom ou référence de l'équipement
            'modele',                 # Modèle ou catégorie de l'équipement
            'quantite',               # Nombre d'unités
            'nomCourtDatacenter',     # Identifiant du datacenter
            'type',                   # Type d'équipement (Ecran, Serveur, etc.)
            'statut',                 # État de l'équipement (Active, Inactive, etc.)
            'paysDUtilisation'        # Pays où l'équipement est utilisé
        ]

        # Colonnes optionnelles dans les fichiers CSV G4IT
        optional_columns = [
            # Informations temporelles
            'dateAchat',           # Date d'acquisition (format YYYY-MM-DD)
            'dateRetrait',         # Date de mise hors service (format YYYY-MM-DD)
            'dureeUsageInterne',   # Durée d'utilisation interne en mois
            'dureeUsageAmont',     # Durée d'utilisation en amont en mois
            'dureeUsageAval',      # Durée d'utilisation en aval en mois
            
            # Informations d'utilisation
            'consoElecAnnuelle',   # Consommation électrique annuelle en kWh
            'utilisateur',         # Service ou personne utilisant l'équipement
            'nomSourceDonnee',     # Source des données pour cet équipement
            'nomEntite',           # Entité responsable de l'équipement
            
            # Caractéristiques techniques
            'nbCoeur',             # Nombre de cœurs de processeur
            'nbJourUtiliseAn',     # Nombre de jours d'utilisation par an
            'goTelecharge',        # Volume de données téléchargées en Go
            
            # Modalités d'utilisation
            'modeUtilisation',     # Mode d'utilisation (Production, Test, etc.)
            'tauxUtilisation',     # Taux d'utilisation moyen (entre 0 et 1)
            'qualite'              # Niveau de qualité ou performance
        ]
        missing_required_columns = []
        type_errors = []

        # Lire les en-têtes du fichier selon son type
        if file_extension == '.csv':
            try:
                # Essayer d'abord avec le séparateur virgule
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Détecter le délimiteur (virgule ou point-virgule)
                delimiter = ';' if ';' in content.split('\n')[0] else ','
                logger.info(f"Délimiteur détecté: {delimiter}")

                # Relire avec le bon délimiteur
                with open(file_path, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f, delimiter=delimiter)
                    detected_columns = next(reader)  # Lire la première ligne (en-têtes)
            except Exception as e:
                logger.error(f"Erreur lors de la lecture du CSV: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Format CSV invalide: {str(e)}")
        elif file_extension in ['.xlsx', '.xls']:
            try:
                df = pd.read_excel(file_path)
                detected_columns = df.columns.tolist()
            except Exception as e:
                logger.error(f"Erreur lors de la lecture du fichier Excel: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Format Excel invalide: {str(e)}")
        else:
            # Nettoyer le fichier temporaire
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail="Format de fichier non supporté. Utilisez CSV ou XLSX.")

        # Vérifier les colonnes requises
        missing_required_columns = [col for col in required_columns if col not in detected_columns]

        # Valider le contenu du fichier si toutes les colonnes requises sont présentes
        if not missing_required_columns:
            # Ici, vous pouvez ajouter votre propre logique de validation
            # Par exemple, vérifier les types de données dans chaque colonne

            # Pour l'exemple, nous allons simuler quelques erreurs de type
            if file_extension == '.csv':
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f, delimiter=delimiter)
                        for row_index, row in enumerate(reader, start=2):  # 2 car l'entête est la ligne 1
                            # Vérifier que quantity est un nombre
                            if 'quantity' in row and row['quantity']:
                                try:
                                    float(row['quantity'])
                                except ValueError:
                                    type_errors.append({
                                        "column": "quantity",
                                        "row": row_index,
                                        "value": row['quantity'],
                                        "expected_type": "nombre"
                                    })
                except Exception as e:
                    logger.error(f"Erreur lors de la validation du CSV: {str(e)}")
            elif file_extension in ['.xlsx', '.xls']:
                try:
                    df = pd.read_excel(file_path)
                    if 'quantity' in df.columns:
                        for row_index, value in enumerate(df['quantity'], start=2):
                            if pd.notna(value) and not isinstance(value, (int, float)):
                                type_errors.append({
                                    "column": "quantity",
                                    "row": row_index,
                                    "value": str(value),
                                    "expected_type": "nombre"
                                })
                except Exception as e:
                    logger.error(f"Erreur lors de la validation du fichier Excel: {str(e)}")

        # Nettoyer le fichier temporaire
        if os.path.exists(file_path):
            os.remove(file_path)

        # Déterminer si le fichier est valide
        is_valid = not missing_required_columns and not type_errors

        return {
            "is_valid": is_valid,
            "required_columns": required_columns,
            "optional_columns": optional_columns,
            "detected_columns": detected_columns,
            "missing_required_columns": missing_required_columns,
            "type_errors": type_errors
        }

    except Exception as e:
        logger.error(f"Erreur lors de la validation du fichier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la validation du fichier: {str(e)}")

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

@app.get("/test", response_class=HTMLResponse)
async def get_test_page():
    with open("tests/test_api.html", "r") as f:
        return f.read()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/equipments")
async def get_equipments(
    page: int = 1,
    limit: int = 10,
    search: str = None,
    type: str = None
):
    """
    Récupère la liste des équipements avec pagination et filtrage
    """
    try:
        # Créer un tableau de données de test (à remplacer par une vraie base de données)
        equipments = []
        equipment_types = ["Laptop", "Desktop", "Server", "Monitor", "Printer"]
        manufacturers = ["Dell", "HP", "Lenovo", "Apple", "ASUS"]

        for i in range(1, 51):
            equipment_type = equipment_types[i % len(equipment_types)]
            manufacturer = manufacturers[i % len(manufacturers)]

            equipment = {
                "id": f"eq-{i}",
                "equipmentType": equipment_type,
                "manufacturer": manufacturer,
                "model": f"Model-{i}",
                "quantity": (i % 10) + 1,
                "cpu": f"CPU-{i}" if i % 3 != 0 else None,
                "ram": f"{(i % 4 + 1) * 8}GB" if i % 2 == 0 else None,
                "storage": f"{(i % 3 + 1) * 256}GB" if i % 2 == 0 else None,
                "purchaseYear": str(2020 + (i % 4)) if i % 3 != 0 else None,
                "eol": str(2025 + (i % 4)) if i % 3 != 0 else None
            }
            equipments.append(equipment)

        # Filtrer les équipements
        filtered_equipments = equipments

        if search:
            search_lower = search.lower()
            filtered_equipments = [
                eq for eq in filtered_equipments
                if (
                    (eq["equipmentType"].lower().find(search_lower) != -1) or
                    (eq["manufacturer"].lower().find(search_lower) != -1) or
                    (eq["model"].lower().find(search_lower) != -1)
                )
            ]

        if type:
            filtered_equipments = [
                eq for eq in filtered_equipments
                if eq["equipmentType"] == type
            ]

        # Calculer la pagination
        total_items = len(filtered_equipments)
        total_pages = (total_items + limit - 1) // limit  # Ceil division

        # S'assurer que la page demandée est valide
        if page < 1:
            page = 1
        elif page > total_pages and total_pages > 0:
            page = total_pages

        # Extraire les éléments pour la page demandée
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_items)
        paged_equipments = filtered_equipments[start_idx:end_idx]

        return {
            "equipments": paged_equipments,
            "total_items": total_items,
            "total_pages": total_pages,
            "page": page,
            "limit": limit
        }

    except Exception as e:
        logger.error(f"Erreur lors de la récupération des équipements: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des équipements: {str(e)}"
        )

@app.post("/api/consolidate")
async def consolidate_equipments(data: dict):
    """
    Consolide les équipements en fonction des données fournies.

    Cette fonction prend une liste d'équipements consolidés et les enregistre
    dans la base de données (simulée pour l'instant).
    """
    try:
        consolidated_equipments = data.get("consolidatedEquipments", [])

        if not consolidated_equipments:
            raise HTTPException(
                status_code=400,
                detail="Aucun équipement à consolider fourni"
            )

        # Ici, dans une application réelle, on sauvegarderait les équipements consolidés
        # dans une base de données et on mettrait à jour les équipements originaux

        logger.info(f"Consolidation de {len(consolidated_equipments)} équipements")

        # Simuler un traitement
        # Dans une application réelle, ce serait une transaction de base de données

        return {
            "success": True,
            "message": f"{len(consolidated_equipments)} équipements ont été consolidés avec succès",
            "consolidated_count": len(consolidated_equipments)
        }

    except Exception as e:
        logger.error(f"Erreur lors de la consolidation des équipements: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la consolidation des équipements: {str(e)}"
        )

@app.get("/api/consolidated-equipments", response_class=JSONResponse)
def get_consolidated_equipments():
    """
    Récupère la liste des équipements consolidés et l'historique des exportations.

    Returns:
        JSONResponse: Un objet JSON contenant les équipements consolidés et l'historique des exportations.
    """
    try:
        # Simuler les données pour la démo
        # Dans une vraie application, on récupérerait ces données depuis une base de données
        consolidated_equipments = [
            {
                "id": "consolidated-1",
                "equipmentType": "Laptop",
                "manufacturer": "Dell",
                "model": "XPS 13",
                "quantity": 5,
                "cpu": "Intel i7",
                "ram": "16GB",
                "storage": "512GB",
                "purchaseYear": "2022",
                "eol": "2027",
                "originalIds": ["eq-1", "eq-2", "eq-3"]
            },
            {
                "id": "consolidated-2",
                "equipmentType": "Desktop",
                "manufacturer": "HP",
                "model": "EliteDesk",
                "quantity": 3,
                "cpu": "Intel i5",
                "ram": "8GB",
                "storage": "1TB",
                "purchaseYear": "2021",
                "eol": "2026",
                "originalIds": ["eq-4", "eq-5"]
            },
            {
                "id": "consolidated-3",
                "equipmentType": "Server",
                "manufacturer": "Lenovo",
                "model": "ThinkSystem",
                "quantity": 2,
                "cpu": "AMD EPYC",
                "ram": "64GB",
                "storage": "4TB",
                "purchaseYear": "2023",
                "eol": "2028",
                "originalIds": ["eq-6", "eq-7"]
            }
        ]

        export_history = [
            {
                "id": "exp-1",
                "filename": "export-20230601.csv",
                "dateExported": "2023-06-01T10:30:00Z",
                "format": "csv",
                "equipmentCount": 8
            },
            {
                "id": "exp-2",
                "filename": "export-20230715.xlsx",
                "dateExported": "2023-07-15T14:45:00Z",
                "format": "xlsx",
                "equipmentCount": 12
            },
            {
                "id": "exp-3",
                "filename": "export-20230920.csv",
                "dateExported": "2023-09-20T09:15:00Z",
                "format": "csv",
                "equipmentCount": 15
            }
        ]

        return {
            "consolidatedEquipments": consolidated_equipments,
            "exportHistory": export_history
        }
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des équipements consolidés: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/export", response_class=Response)
async def export_equipments(data: dict):
    """
    Exporte les équipements consolidés au format CSV ou XLSX.

    Args:
        data (dict): Un dictionnaire contenant le format d'export et les équipements à exporter.

    Returns:
        Response: Le fichier CSV ou XLSX à télécharger.
    """
    try:
        format = data.get("format")
        equipments = data.get("equipments", [])

        if not format or format not in ["csv", "xlsx"]:
            raise HTTPException(status_code=400, detail="Format non valide. Utilisez 'csv' ou 'xlsx'")

        if not equipments or not isinstance(equipments, list) or len(equipments) == 0:
            raise HTTPException(status_code=400, detail="Aucun équipement à exporter")

        # Préparer les données pour l'export
        export_data = []
        for eq in equipments:
            export_data.append({
                "Type d'équipement": eq.get("equipmentType", ""),
                "Fabricant": eq.get("manufacturer", ""),
                "Modèle": eq.get("model", ""),
                "Quantité": eq.get("quantity", 0),
                "CPU": eq.get("cpu", ""),
                "RAM": eq.get("ram", ""),
                "Stockage": eq.get("storage", ""),
                "Année d'achat": eq.get("purchaseYear", ""),
                "Fin de vie": eq.get("eol", ""),
                "IDs d'origine": ", ".join(eq.get("originalIds", []))
            })

        # Générer le fichier selon le format demandé
        if format == "csv":
            # Générer un CSV
            import csv
            import io

            output = io.StringIO()
            fieldnames = export_data[0].keys() if export_data else []

            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(export_data)

            content = output.getvalue().encode('utf-8-sig')  # Avec BOM pour Excel
            media_type = "text/csv"
            filename = f"export-{datetime.now().strftime('%Y%m%d')}.csv"
        else:
            # Générer un XLSX
            import pandas as pd
            import io

            df = pd.DataFrame(export_data)
            output = io.BytesIO()

            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, sheet_name='Équipements', index=False)

                # Ajuster les largeurs de colonnes
                worksheet = writer.sheets['Équipements']
                for i, col in enumerate(df.columns):
                    max_width = max(df[col].astype(str).map(len).max(), len(col))
                    worksheet.set_column(i, i, max_width + 2)

            content = output.getvalue()
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"export-{datetime.now().strftime('%Y%m%d')}.xlsx"

        # Enregistrer l'historique d'export (dans une vraie application)
        # export_id = save_export_history(filename, format, len(equipments))

        # Retourner le fichier
        return Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Erreur lors de l'export des équipements: {e}")
        raise HTTPException(status_code=500, detail=str(e))
