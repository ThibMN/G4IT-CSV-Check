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
      // Essayer d'appeler le backend
      const response = await axios.post(
        `${BACKEND_URL}/api/export`,
        { format, equipments },
        {
          timeout: 10000,
          responseType: 'arraybuffer'
        }
      );

      // Retourner directement la réponse du backend
      return new NextResponse(response.data, {
        headers: {
          'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=export.${format}`
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'appel au backend pour l\'export:', error);

      // Générer le fichier côté frontend en cas d'erreur
      const fileData = generateExportFile(equipments, format);

      return new NextResponse(fileData, {
        headers: {
          'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=export.${format}`
        }
      });
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
  // Transformer les équipements en format plat pour l'export
  const dataForExport = equipments.map(eq => ({
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

  if (format === 'csv') {
    // Générer un CSV
    const csv = Papa.unparse(dataForExport);
    return Buffer.from(csv);
  } else {
    // Générer un XLSX
    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Équipements');

    const xlsxData = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(xlsxData);
  }
}
