import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8001';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier n\'a été fourni' },
        { status: 400 }
      );
    }

    // Créer un FormData pour envoyer le fichier au backend
    const formData = new FormData();
    formData.append('file', file);

    // Envoyer le fichier au backend pour traitement
    const response = await axios.post(`${BACKEND_URL}/api/process-file-data`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Retourner les données traitées
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Erreur lors du traitement du fichier:', error);
    
    // Renvoyer une réponse d'erreur
    return NextResponse.json(
      { 
        error: 'Une erreur s\'est produite lors du traitement du fichier',
        details: error.message 
      },
      { status: 500 }
    );
  }
}