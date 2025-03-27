import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8001';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching consolidated equipments from backend...');

    // Essayer d'appeler le backend
    const response = await axios.get(`${BACKEND_URL}/api/consolidated-equipments`, {
      timeout: 5000
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching consolidated equipments:', error);

    // Utiliser des données de test en cas d'erreur
    return NextResponse.json({
      consolidatedEquipments: getMockConsolidatedEquipments(),
      exportHistory: getMockExportHistory()
    });
  }
}

// Données de test pour les équipements consolidés
function getMockConsolidatedEquipments() {
  return [
    {
      id: 'consolidated-1',
      equipmentType: 'Laptop',
      manufacturer: 'Dell',
      model: 'XPS 13',
      quantity: 5,
      cpu: 'Intel i7',
      ram: '16GB',
      storage: '512GB',
      purchaseYear: '2022',
      eol: '2027',
      originalIds: ['eq-1', 'eq-2', 'eq-3']
    },
    {
      id: 'consolidated-2',
      equipmentType: 'Desktop',
      manufacturer: 'HP',
      model: 'EliteDesk',
      quantity: 3,
      cpu: 'Intel i5',
      ram: '8GB',
      storage: '1TB',
      purchaseYear: '2021',
      eol: '2026',
      originalIds: ['eq-4', 'eq-5']
    },
    {
      id: 'consolidated-3',
      equipmentType: 'Server',
      manufacturer: 'Lenovo',
      model: 'ThinkSystem',
      quantity: 2,
      cpu: 'AMD EPYC',
      ram: '64GB',
      storage: '4TB',
      purchaseYear: '2023',
      eol: '2028',
      originalIds: ['eq-6', 'eq-7']
    }
  ];
}

// Données de test pour l'historique d'export
function getMockExportHistory() {
  return [
    {
      id: 'exp-1',
      filename: 'export-20230601.csv',
      dateExported: '2023-06-01T10:30:00Z',
      format: 'csv',
      equipmentCount: 8
    },
    {
      id: 'exp-2',
      filename: 'export-20230715.xlsx',
      dateExported: '2023-07-15T14:45:00Z',
      format: 'xlsx',
      equipmentCount: 12
    },
    {
      id: 'exp-3',
      filename: 'export-20230920.csv',
      dateExported: '2023-09-20T09:15:00Z',
      format: 'csv',
      equipmentCount: 15
    }
  ];
}
