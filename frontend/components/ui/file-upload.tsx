"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { Trash2, X } from "lucide-react";
import { useFileProcessor } from '@/hooks/useFileProcessor';
import { Loader2 } from 'lucide-react';

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
}: {
  onChange?: (files: File[]) => void;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    onChange && onChange(newFiles);
  };

  const handleDeleteFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    // Informer le parent que des fichiers ont été supprimés
    onChange && onChange(updatedFiles);
  };

  const handleClearAllFiles = () => {
    setFiles([]);
    // Informer le parent que tous les fichiers ont été supprimés
    onChange && onChange([]);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
            Charger un fichier
          </p>
          <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
            Glissez-déposez votre fichier ici ou cliquez pour le charger
          </p>
          <div className="relative w-full mt-4 max-w-xl mx-auto">
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  className={cn(
                    "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md",
                    "shadow-sm"
                  )}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(idx);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors z-50"
                    title="Supprimer"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex justify-between w-full items-center gap-4 pr-8">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs"
                    >
                      {file.name}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
                    >
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>

                  <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 "
                    >
                      {file.type}
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                    >
                      modified{" "}
                      {new Date(file.lastModified).toLocaleDateString()}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                  "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-neutral-600 flex flex-col items-center"
                  >
                    Déposez-le
                    <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </motion.p>
                ) : (
                  <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}

interface ValidationResult {
  is_valid: boolean;
  missing_required_columns: string[];
  type_errors: Array<{
    row: number;
    column: string;
    error: string;
  }>;
  temp_file_path?: string;
  original_filename?: string;
  file_format?: string;
  general_error?: string;
}

export default function FileUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Renommer isUploading en isProcessing pour cohérence
  const [correctedFilePath, setCorrectedFilePath] = useState<string | null>(null); // Ajout de cette variable manquante
  
  const { 
    processFile, 
    validationResult, 
    error, 
    isLoading, // Récupérer cette variable du hook useFileProcessor
    correctDates,  // Récupérer cette fonction du hook useFileProcessor
    downloadFile,  // Récupérer cette fonction du hook useFileProcessor
    cleanup       // Récupérer cette fonction du hook useFileProcessor
  } = useFileProcessor();
  
  const handleFileChange = (files: File[]) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      // Réinitialiser les états lors du changement de fichier
      setCorrectedFilePath(null);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    try {
      await processFile(selectedFile);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Ajouter cette fonction manquante
  const handleDateCorrection = async (column: string) => {
    if (!validationResult?.temp_file_path) return;
    
    setIsProcessing(true);
    try {
      const result = await correctDates(validationResult.temp_file_path, column);
      if (result?.success && result.corrected_file_path) {
        setCorrectedFilePath(result.corrected_file_path);
      }
    } catch (err) {
      console.error("Erreur lors de la correction des dates:", err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Ajouter cette fonction manquante
  const handleDownload = async () => {
    const fileToDownload = correctedFilePath || validationResult?.temp_file_path;
    if (!fileToDownload) return;
    
    setIsProcessing(true);
    try {
      await downloadFile(fileToDownload);
      
      // Nettoyer les fichiers temporaires après téléchargement
      if (correctedFilePath) {
        await cleanup(correctedFilePath);
      }
      if (validationResult?.temp_file_path) {
        await cleanup(validationResult.temp_file_path);
      }
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">G4IT CSV Checker</h1>
      
      {/* Upload avec le composant FileUpload */}
      <div className="mb-6">
        <FileUpload onChange={handleFileChange} />
        
        {selectedFile && (
          <div className="mt-4 flex justify-center">
            <button 
              onClick={handleUpload} 
              disabled={isProcessing || isLoading}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 transition-colors text-white px-6 py-3 rounded-md disabled:bg-blue-300"
            >
              {isProcessing || isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                'Valider le fichier'
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Affichage des erreurs */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-400 text-red-700 p-4 mb-6 rounded-lg shadow-sm"
        >
          <p className="font-semibold">Erreur</p>
          <p>{error}</p>
        </motion.div>
      )}
      
      {/* Affichage des résultats de validation */}
      {validationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">Résultat de validation</h2>
          
          {validationResult.is_valid ? (
            <div className="bg-green-100 border border-green-400 text-green-700 p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-semibold">Le fichier est valide et prêt pour G4IT !</p>
              </div>
              <p className="mt-2 text-green-600">Toutes les colonnes requises sont présentes et les données sont au bon format.</p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Le fichier contient des erreurs
              </h3>
              
              {validationResult.missing_required_columns?.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-100 rounded-md">
                  <p className="font-semibold">Colonnes obligatoires manquantes :</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {validationResult.missing_required_columns.map(col => (
                      <li key={col} className="text-yellow-900">{col}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResult.type_errors?.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-100 rounded-md">
                  <p className="font-semibold">Erreurs de type de données :</p>
                  <ul className="list-disc list-inside mt-2 space-y-2">
                    {validationResult.type_errors.slice(0, 5).map((error, idx) => (
                      <li key={idx} className="text-yellow-900">
                        <span>
                          Ligne <span className="font-medium">{error.row}</span>, 
                          colonne <span className="font-medium">'{error.column}'</span>: {error.error}
                        </span>
                        {error.column.toLowerCase().includes('date') && (
                          <button 
                            onClick={() => handleDateCorrection(error.column)}
                            disabled={isProcessing}
                            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded-md transition-colors disabled:bg-blue-300 inline-flex items-center gap-1"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Correction...
                              </>
                            ) : (
                              'Corriger les dates'
                            )}
                          </button>
                        )}
                      </li>
                    ))}
                    {validationResult.type_errors.length > 5 && (
                      <li className="text-yellow-700 font-medium">...et {validationResult.type_errors.length - 5} autres erreurs.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <button 
              onClick={handleDownload}
              disabled={!validationResult.temp_file_path || isProcessing}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 transition-colors text-white px-6 py-3 rounded-md disabled:bg-green-300 shadow-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                correctedFilePath ? 'Télécharger le fichier corrigé' : 'Télécharger le fichier validé'
              )}
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Information supplémentaire */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 mb-2">À propos de G4IT CSV Checker</h3>
        <p className="text-gray-600">
          Cet outil vous aide à valider et corriger vos fichiers CSV et XLSX avant de les soumettre à l'outil de calcul G4IT.
          Il vérifie la présence des colonnes obligatoires et s'assure que les données sont au bon format.
        </p>
      </div>
    </div>
  );
}
