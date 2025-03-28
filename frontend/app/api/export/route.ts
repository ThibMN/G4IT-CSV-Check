import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8001';

export async function POST(request: NextRequest) {
  try {
    // Récupérer les données du body
    const { format, equipments } = await request.json();

    if (!equipments || !Array.isArray(equipments) || equipments.length === 0) {
      return NextResponse.json(
        { error: 'Aucun équipement à exporter' },
        { status: 400 }
      );
    }

    if (!format || (format !== 'csv' && format !== 'xlsx')) {
      return NextResponse.json(
        { error: 'Format non valide. Utilisez "csv" ou "xlsx"' },
        { status: 400 }
      );
    }

    try {
      // Générer un nom de fichier avec timestamp et extension
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      const filename = `export-${timestamp}.${format}`;

      // Appeler le backend pour l'export
      const response = await axios.post(
        `${BACKEND_URL}/api/export`,
        { format, equipments },
        {
          timeout: 10000,
          responseType: 'arraybuffer'
        }
      );

      // IMPORTANT: Utilisez l'en-tête Content-Disposition du backend s'il existe, 
      // sinon utilisez le nom de fichier généré
      const contentDisposition = response.headers['content-disposition'];
      const backendFilename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : null;

      // Déterminer le bon type MIME
      const contentType = format === 'csv' 
        ? 'text/csv' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      // Renvoyer la réponse avec des en-têtes corrects
      return new NextResponse(response.data, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${backendFilename || filename}"` 
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'appel au backend pour l\'export:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des équipements' },
      { status: 500 }
    );
  }
}

// Fonction pour générer un fichier d'export
function generateExportFile(equipments: any[], format: string): Buffer {
  // Vérifier si les équipements sont au format mappé
  const isMappedFormat = equipments.length > 0 && 'nomEquipementPhysique' in equipments[0];
  
  if (format === 'csv') {
    // Générer un CSV
    let csv: string;
    
    if (isMappedFormat) {
      // Format mappé
      const mappedData = equipments.map(eq => ({
        'Nom Équipement': eq.nomEquipementPhysique || '',
        'Type': eq.type || '',
        'Modèle': eq.modele || '',
        'Quantité': eq.quantite || '',
        'Datacenter': eq.nomCourtDatacenter || '',
        'Statut': eq.statut || '',
        'Pays': eq.paysDUtilisation || '',
        'Date achat': eq.dateAchat || '',
        'Date retrait': eq.dateRetrait || '',
        'Nb. Coeur': eq.nbCoeur || '',
        'Taux Utilisation': eq.tauxUtilisation || '',
        'Consommation': eq.consoElecAnnuelle || ''
      }));
      
      csv = Papa.unparse({
        fields: Object.keys(mappedData[0] || {}),
        data: mappedData
      });
    } else {
      // Format standard
      const standardData = equipments.map(eq => ({
        'Type d\'équipement': eq.equipmentType,
        'Fabricant': eq.manufacturer,
        'Modèle': eq.model,
        'Quantité': eq.quantity,
        'CPU': eq.cpu || '',
        'RAM': eq.ram || '',
        'Stockage': eq.storage || '',
        'Année d\'achat': eq.purchaseYear || '',
        'Fin de vie': eq.eol || '',
        'IDs d\'origine': eq.originalIds ? eq.originalIds.join(', ') : ''
      }));
      
      csv = Papa.unparse({
        fields: Object.keys(standardData[0] || {}),
        data: standardData
      });
    }
    
    return Buffer.from(csv);
  } else {
    // Générer un XLSX
    let worksheetData;
    
    if (isMappedFormat) {
      // Format mappé
      worksheetData = equipments.map(eq => ({
        'Nom Équipement': eq.nomEquipementPhysique || '',
        'Type': eq.type || '',
        'Modèle': eq.modele || '',
        'Quantité': eq.quantite || '',
        'Datacenter': eq.nomCourtDatacenter || '',
        'Statut': eq.statut || '',
        'Pays': eq.paysDUtilisation || '',
        'Date achat': eq.dateAchat || '',
        'Date retrait': eq.dateRetrait || '',
        'Nb. Coeur': eq.nbCoeur || '',
        'Taux Utilisation': eq.tauxUtilisation || '',
        'Consommation': eq.consoElecAnnuelle || ''
      }));
    } else {
      // Format standard
      worksheetData = equipments.map(eq => ({
        'Type d\'équipement': eq.equipmentType,
        'Fabricant': eq.manufacturer,
        'Modèle': eq.model,
        'Quantité': eq.quantity,
        'CPU': eq.cpu || '',
        'RAM': eq.ram || '',
        'Stockage': eq.storage || '',
        'Année d\'achat': eq.purchaseYear || '',
        'Fin de vie': eq.eol || '',
        'IDs d\'origine': eq.originalIds ? eq.originalIds.join(', ') : ''
      }));
    }
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Équipements');

    const xlsxData = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(xlsxData);
  }
}
