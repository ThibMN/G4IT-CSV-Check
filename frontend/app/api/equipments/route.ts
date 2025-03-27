import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8001';

// Fonction pour simuler des données d'équipements (à utiliser pendant le développement)
function getMockEquipments(page: number, limit: number, search?: string, type?: string) {
  // Créer un tableau de données de test
  const allEquipments = Array(50).fill(null).map((_, index) => ({
    id: `eq-${index + 1}`,
    equipmentType: ['Laptop', 'Desktop', 'Server', 'Monitor', 'Printer'][Math.floor(Math.random() * 5)],
    manufacturer: ['Dell', 'HP', 'Lenovo', 'Apple', 'ASUS'][Math.floor(Math.random() * 5)],
    model: `Model-${index + 1}`,
    quantity: Math.floor(Math.random() * 10) + 1,
    cpu: Math.random() > 0.3 ? ['Intel i5', 'Intel i7', 'AMD Ryzen 5', 'AMD Ryzen 7'][Math.floor(Math.random() * 4)] : undefined,
    ram: Math.random() > 0.3 ? ['8GB', '16GB', '32GB'][Math.floor(Math.random() * 3)] : undefined,
    storage: Math.random() > 0.3 ? ['256GB', '512GB', '1TB'][Math.floor(Math.random() * 3)] : undefined,
    purchaseYear: Math.random() > 0.3 ? ['2020', '2021', '2022', '2023'][Math.floor(Math.random() * 4)] : undefined,
    eol: Math.random() > 0.3 ? ['2025', '2026', '2027', '2028'][Math.floor(Math.random() * 4)] : undefined,
  }));

  // Appliquer les filtres
  let filteredEquipments = [...allEquipments];

  if (search) {
    const searchLower = search.toLowerCase();
    filteredEquipments = filteredEquipments.filter(eq =>
      eq.equipmentType.toLowerCase().includes(searchLower) ||
      eq.manufacturer.toLowerCase().includes(searchLower) ||
      eq.model.toLowerCase().includes(searchLower)
    );
  }

  if (type) {
    filteredEquipments = filteredEquipments.filter(eq =>
      eq.equipmentType === type
    );
  }

  // Calculer la pagination
  const totalItems = filteredEquipments.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalItems);
  const paginatedEquipments = filteredEquipments.slice(startIndex, endIndex);

  return {
    equipments: paginatedEquipments,
    total_items: totalItems,
    total_pages: totalPages,
    page,
    limit
  };
}

export async function GET(req: NextRequest) {
  try {
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';

    try {
      // Essayer d'appeler le backend
      const response = await axios.get(`${BACKEND_URL}/api/equipments`, {
        params: { page, limit, search, type },
        timeout: 3000 // timeout de 3 secondes
      });

      return NextResponse.json(response.data);
    } catch (error) {
      console.log('Erreur lors de la communication avec le backend, utilisation des données de test');

      // Si le backend n'est pas disponible, utiliser des données de test
      const mockData = getMockEquipments(page, limit, search, type);
      return NextResponse.json(mockData);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des équipements:', error);
    return NextResponse.json(
      { error: 'Une erreur s\'est produite lors de la récupération des équipements' },
      { status: 500 }
    );
  }
}
