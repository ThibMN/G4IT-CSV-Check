import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8001';

export async function POST(req: NextRequest) {
  try {
    // Récupérer le FormData de la requête
    const formData = await req.formData();

    // Vérifier si le fichier est présent
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    console.log('Fichier reçu pour détection des en-têtes:', file.name, file.size, file.type);

    // Créer un nouveau FormData pour l'envoyer au backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    console.log('Envoi au backend pour détection des en-têtes:', BACKEND_URL);

    // Envoyer la requête au backend
    const response = await axios.post(
      `${BACKEND_URL}/api/detect-headers`,
      backendFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000, // 10 secondes de timeout
      }
    );

    console.log('Réponse du backend (detect-headers):', response.status);

    // Retourner la réponse du backend
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('Erreur lors de la détection des en-têtes:', error);
    
    // Si l'erreur vient d'Axios, extraire les détails
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.detail || 'Erreur lors de la communication avec le backend';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }
    
    // Erreur générique
    return NextResponse.json(
      { error: 'Une erreur s\'est produite lors de la détection des en-têtes' },
      { status: 500 }
    );
  }
}