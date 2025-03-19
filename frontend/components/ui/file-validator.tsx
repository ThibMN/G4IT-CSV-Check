"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  File as FileIcon,
  AlertCircle,
  CheckCircle,
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseFile } from "@/lib/file-parser";
import { processFileData } from "@/lib/validation-utils";
import { useErrorStore } from "@/store/error-store";

interface FileValidatorProps {
  onValidFile?: (data: any[]) => void;
  acceptedFormats?: string;
  maxSizeMB?: number;
  label?: string;
  buttonText?: string;
}

export default function FileValidator({
  onValidFile,
  acceptedFormats = ".csv, .xlsx, .xls",
  maxSizeMB = 10,
  label = "Sélectionnez un fichier",
  buttonText = "Parcourir"
}: FileValidatorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setErrors, setLoading } = useErrorStore();

  // États locaux
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Gérer la sélection d'un fichier
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setIsSuccess(false);
    setError(null);

    if (!files || files.length === 0) {
      setFile(null);
      return;
    }

    const selectedFile = files[0];
    setFile(selectedFile);

    // Vérifier la taille du fichier
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`Le fichier est trop volumineux. La taille maximale est de ${maxSizeMB} Mo.`);
      return;
    }

    // Vérifier le format du fichier
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError(`Format de fichier non supporté. Formats acceptés: ${acceptedFormats}`);
      return;
    }

    // Lancer le traitement du fichier
    await processFile(selectedFile);
  };

  // Traiter le fichier
  const processFile = async (file: File) => {
    setIsProcessing(true);
    setLoading(true);

    try {
      // Parser le fichier
      const parseResult = await parseFile(file);

      // Vérifier si des erreurs de parsing
      if (parseResult.error) {
        setError(parseResult.error);
        setLoading(false);
        setIsProcessing(false);
        return;
      }

      // Pas de données
      if (!parseResult.data || parseResult.data.length === 0) {
        setError("Le fichier ne contient pas de données valides.");
        setLoading(false);
        setIsProcessing(false);
        return;
      }

      // Valider les données
      const { errors, processedData, canExport } = processFileData(parseResult.data);

      // Si des erreurs sont détectées
      if (errors.length > 0) {
        // Enregistrer les erreurs dans le store
        setErrors(errors);

        // Rediriger vers la page de gestion des erreurs
        setTimeout(() => {
          router.push('/error-management');
        }, 500);

        return;
      }

      // Si tout est valide
      setIsSuccess(true);

      // Appeler le callback avec les données traitées
      if (onValidFile) {
        onValidFile(processedData);
      }
    } catch (err: any) {
      setError(`Erreur lors du traitement du fichier: ${err.message || "Erreur inconnue"}`);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // Réinitialiser l'input de fichier
  const resetFileInput = () => {
    setFile(null);
    setError(null);
    setIsSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {/* Input de fichier masqué */}
      <input
        type="file"
        accept={acceptedFormats}
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />

      {/* Zone de dépôt et bouton de parcours */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
        <div className="space-y-2">
          <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{label}</p>
            <p className="mt-1">ou glissez-déposez votre fichier ici</p>
          </div>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="mt-2"
            disabled={isProcessing}
          >
            {buttonText}
          </Button>
        </div>
      </div>

      {/* Affichage du fichier sélectionné */}
      {file && (
        <div className={`
          mt-4 p-3 rounded-md flex items-center justify-between
          ${error ? 'bg-red-50 border border-red-200' :
            isSuccess ? 'bg-green-50 border border-green-200' :
            'bg-blue-50 border border-blue-200'}
        `}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <FileIcon className={`
                h-5 w-5
                ${error ? 'text-red-500' :
                  isSuccess ? 'text-green-500' :
                  'text-blue-500'}
              `} />
            </div>
            <div className="text-sm">
              <span className="font-medium">{file.name}</span>
              <span className="text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isProcessing ? (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            ) : error ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : isSuccess ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              onClick={resetFileInput}
              disabled={isProcessing}
              className="p-1 h-auto text-gray-400 hover:text-gray-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-start gap-1.5">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Message de succès */}
      {isSuccess && (
        <div className="mt-2 text-sm text-green-600 flex items-start gap-1.5">
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Fichier validé avec succès !</span>
        </div>
      )}
    </div>
  );
}
