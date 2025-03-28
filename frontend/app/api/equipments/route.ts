import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8001';

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
      console.error('Erreur lors de la communication avec le backend:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la communication avec le backend' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des équipements:', error);
    return NextResponse.json(
      { error: 'Une erreur s\'est produite lors de la récupération des équipements' },
      { status: 500 }
    );
  }
}
