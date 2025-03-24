import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const validateFile = async (file: File) => {
  console.log("🔹 validateFile: Préparation de FormData");
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    console.log(`🔹 validateFile: Envoi du fichier ${file.name} vers ${API_URL}/api/validate-file`);
    const response = await api.post('/api/validate-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log("🔹 validateFile: Réponse reçue", response.status);
    return response.data;
  } catch (error: any) {
    console.error("🔹 validateFile: ERREUR", error);
    throw error;
  }
};

export const fixDates = async (filePath: string, dateColumn: string) => {
  const formData = new FormData();
  formData.append('file_path', filePath);
  formData.append('date_column', dateColumn);
  
  try {
    const response = await api.post('/api/fix-dates', formData);
    return response.data;
  } catch (error) {
    console.error('Error fixing dates:', error);
    throw error;
  }
};

export const downloadProcessedFile = async (filePath: string) => {
  const formData = new FormData();
  formData.append('file_path', filePath);
  
  try {
    const response = await api.post('/api/download-processed-file', formData, {
      responseType: 'blob',
    });
    
    // Créer un URL pour le blob et déclencher le téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extraire le nom du fichier du chemin
    const fileName = filePath.split('/').pop() || 'processed-file';
    link.setAttribute('download', fileName);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const cleanupTempFile = async (filePath: string) => {
  const formData = new FormData();
  formData.append('file_path', filePath);
  
  try {
    const response = await api.delete('/api/cleanup', {
      data: formData,
    });
    return response.data;
  } catch (error) {
    console.error('Error cleaning up file:', error);
    throw error;
  }
};