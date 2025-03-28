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
    // Si l'appel échoue, retourner une réponse d'erreur
    return NextResponse.json(
      { error: 'Failed to fetch consolidated equipments', details: (error as Error).message },
      { status: 500});
  }
}
