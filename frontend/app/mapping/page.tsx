"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, HelpCircle, CheckCircle, ChevronDown, FileUp } from "lucide-react";
import { useHeaderMappingStore } from "@/store/header-mapping-store";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import axios from 'axios';
import Navbar from "@/components/layout/navbar";
import { useRouter } from "next/navigation";
import { useFileStore } from "@/store/file-store";
import { useProcessedDataStore } from "@/store/processed-data-store";
import { parseFile } from "@/lib/file-parser"; // Assurez-vous que vous avez cette fonction

// Définition des types
interface ExpectedHeader {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

interface DetectedHeader {
  name: string;
  index: number;
  mappedTo: string | null;
}

// En-têtes attendus avec leurs descriptions
const expectedHeaders: ExpectedHeader[] = [
  // Champs obligatoires
  {
    key: "nomEquipementPhysique",
    label: "Nom de l'équipement",
    required: true,
    description: "Le nom unique qui identifie l'équipement physique"
  },
  {
    key: "modele",
    label: "Modèle",
    required: true,
    description: "Le modèle ou la catégorie de l'équipement"
  },
  {
    key: "quantite",
    label: "Quantité",
    required: true,
    description: "Le nombre d'unités de cet équipement"
  },
  {
    key: "nomCourtDatacenter",
    label: "Datacenter",
    required: true,
    description: "L'identifiant du datacenter hébergeant l'équipement"
  },
  {
    key: "type",
    label: "Type",
    required: true,
    description: "Le type d'équipement (Serveur, Ecran, PC, etc.)"
  },
  {
    key: "statut",
    label: "Statut",
    required: true,
    description: "L'état actuel de l'équipement (Active, Inactive, etc.)"
  },
  {
    key: "paysDUtilisation",
    label: "Pays d'utilisation",
    required: true,
    description: "Le pays où l'équipement est utilisé"
  },
  
  // Champs optionnels - Informations temporelles
  {
    key: "dateAchat",
    label: "Date d'achat",
    required: false,
    description: "La date d'acquisition de l'équipement (format YYYY-MM-DD)"
  },
  {
    key: "dateRetrait",
    label: "Date de retrait",
    required: false,
    description: "La date de mise hors service prévue ou effective (format YYYY-MM-DD)"
  },
  {
    key: "dureeUsageInterne",
    label: "Durée usage interne",
    required: false,
    description: "La durée d'utilisation interne en mois"
  },
  {
    key: "dureeUsageAmont",
    label: "Durée usage amont",
    required: false,
    description: "La durée d'utilisation en amont en mois"
  },
  {
    key: "dureeUsageAval",
    label: "Durée usage aval",
    required: false,
    description: "La durée d'utilisation en aval en mois"
  },
  
  // Champs optionnels - Consommation et utilisation
  {
    key: "consoElecAnnuelle",
    label: "Consommation électrique",
    required: false,
    description: "La consommation électrique annuelle en kWh"
  },
  {
    key: "utilisateur",
    label: "Utilisateur",
    required: false,
    description: "Le service ou la personne utilisant l'équipement"
  },
  {
    key: "nomSourceDonnee",
    label: "Source de données",
    required: false,
    description: "La source des données pour cet équipement"
  },
  {
    key: "nomEntite",
    label: "Entité",
    required: false,
    description: "L'entité responsable de l'équipement"
  },
  
  // Champs optionnels - Caractéristiques techniques
  {
    key: "nbCoeur",
    label: "Nombre de cœurs",
    required: false,
    description: "Le nombre de cœurs de processeur (pour serveurs/PC)"
  },
  {
    key: "nbJourUtiliseAn",
    label: "Jours d'utilisation par an",
    required: false,
    description: "Le nombre de jours d'utilisation par an"
  },
  {
    key: "goTelecharge",
    label: "Go téléchargés",
    required: false,
    description: "Le volume de données téléchargées en Go"
  },
  
  // Champs optionnels - Modalités d'utilisation
  {
    key: "modeUtilisation",
    label: "Mode d'utilisation",
    required: false,
    description: "Le mode d'utilisation (Production, Test, Développement, etc.)"
  },
  {
    key: "tauxUtilisation",
    label: "Taux d'utilisation",
    required: false,
    description: "Le taux d'utilisation moyen (entre 0 et 1)"
  },
  {
    key: "qualite",
    label: "Qualité",
    required: false,
    description: "Le niveau de qualité ou de performance de l'équipement"
  }
];

export default function HeaderMapping() {
  const router = useRouter();
  
  // États locaux
  const [detectedHeaders, setDetectedHeaders] = useState<DetectedHeader[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [openSelects, setOpenSelects] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false); // Ajout de cette ligne

  // Récupérer le fichier et les colonnes depuis le store global
  const { currentFile, detectedColumns } = useFileStore();
  
  // Zustand store pour sauvegarder le mapping
  const { setMapping, mapping } = useHeaderMappingStore();
  const { setProcessedData } = useProcessedDataStore();

  // Vérifier si un fichier est déjà disponible dans le store global
  useEffect(() => {
    if (currentFile && detectedColumns.length > 0) {
      // Si un fichier existe déjà, utiliser les colonnes déjà détectées
      const headers: DetectedHeader[] = detectedColumns.map((column: string, index: number) => ({
        name: column,
        index: index,
        mappedTo: null // Au départ, aucune colonne n'est mappée
      }));
      
      setDetectedHeaders(headers);
      setIsFileUploaded(true);
      
      // Suggestion automatique basée sur la similarité des noms
      suggestMappings(headers);
    }
  }, [currentFile, detectedColumns]);

  // Effet pour charger le mapping existant
  useEffect(() => {
    if (mapping && Object.keys(mapping).length > 0) {
      setDetectedHeaders(prev =>
        prev.map(header => ({
          ...header,
          mappedTo: mapping[header.index] || null,
        }))
      );
    }
  }, [mapping]);

  // Fonction pour traiter le fichier uploadé
  const handleFilesChanged = async (files: File[]) => {
    setErrorMessage(null);
    
    if (files.length === 0) {
      return;
    }

    const file = files[0]; // On prend le premier fichier
    setIsLoading(true);

    try {
      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', file);
      
      // Envoyer le fichier au backend pour extraction des en-têtes
      const response = await axios.post('/api/detect-headers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Transformer les en-têtes détectés en format attendu
      if (response.data && Array.isArray(response.data.detected_columns)) {
        const headers: DetectedHeader[] = response.data.detected_columns.map((column: string, index: number) => ({
          name: column,
          index: index,
          mappedTo: null // Au départ, aucune colonne n'est mappée
        }));
        
        setDetectedHeaders(headers);
        setIsFileUploaded(true);
        
        // Suggestion automatique basée sur la similarité des noms
        suggestMappings(headers);
      }
    } catch (error: any) {
      console.error("Erreur lors de la détection des en-têtes:", error);
      setErrorMessage(error.response?.data?.message || "Erreur lors de l'analyse du fichier");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour suggérer des mappings automatiques basés sur la similarité des noms
  const suggestMappings = (headers: DetectedHeader[]) => {
    const newHeaders = [...headers];
    
    // Fonction pour calculer la distance de Levenshtein (similarité de chaînes)
    const levenshteinDistance = (a: string, b: string): number => {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
  
      const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  
      for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
      for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,      // suppression
            matrix[i][j - 1] + 1,      // insertion
            matrix[i - 1][j - 1] + cost // substitution
          );
        }
      }
  
      return matrix[a.length][b.length];
    };
  
    // Fonction pour calculer la similarité entre deux chaînes (0 à 1)
    const stringSimilarity = (a: string, b: string): number => {
      const maxLength = Math.max(a.length, b.length);
      if (maxLength === 0) return 1.0; // Les deux chaînes sont vides
      
      const distance = levenshteinDistance(a, b);
      return 1 - distance / maxLength;
    };
  
    // Pour chaque en-tête détecté, trouver le meilleur match
    newHeaders.forEach(header => {
      // Normaliser le nom de la colonne (minuscules, sans espaces, sans accents)
      const normalizedName = header.name
        .toLowerCase()
        .replace(/\s+/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      
      let bestMatch: { key: string; similarity: number } | null = null;
      
      // Chercher la meilleure correspondance dans les en-têtes attendus
      for (const expected of expectedHeaders) {
        const normalizedKey = expected.key
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        
        const normalizedLabel = expected.label
          .toLowerCase()
          .replace(/\s+/g, '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        
        // Vérifier d'abord les correspondances exactes (priorité maximale)
        if (normalizedName === normalizedKey || normalizedName === normalizedLabel) {
          bestMatch = { key: expected.key, similarity: 1.0 };
          break;
        }
  
        // Vérifier si la colonne contient la clé ou le label attendu
        if (normalizedName.includes(normalizedKey) || normalizedName.includes(normalizedLabel)) {
          const similarity = Math.max(
            normalizedKey.length / normalizedName.length,
            normalizedLabel.length / normalizedName.length
          );
          
          if (!bestMatch || similarity > bestMatch.similarity) {
            bestMatch = { key: expected.key, similarity: similarity };
          }
        } 
        // Calculer la similarité de chaîne
        else {
          const keySimilarity = stringSimilarity(normalizedName, normalizedKey);
          const labelSimilarity = stringSimilarity(normalizedName, normalizedLabel);
          const maxSimilarity = Math.max(keySimilarity, labelSimilarity);
          
          // Ne considérer que les similarités au-dessus d'un certain seuil
          if (maxSimilarity > 0.7 && (!bestMatch || maxSimilarity > bestMatch.similarity)) {
            bestMatch = { key: expected.key, similarity: maxSimilarity };
          }
        }
      }
      
      // Appliquer le meilleur match trouvé
      if (bestMatch) {
        header.mappedTo = bestMatch.key;
      }
    });
    
    setDetectedHeaders(newHeaders);
  
    // Vérifier s'il reste des champs obligatoires non mappés et essayer de les mapper
    const mappedKeys = newHeaders
      .filter(h => h.mappedTo)
      .map(h => h.mappedTo);
    
    const unmappedRequiredKeys = expectedHeaders
      .filter(h => h.required && !mappedKeys.includes(h.key))
      .map(h => h.key);
  
    // S'il reste des champs obligatoires non mappés, essayer de les mapper
    // aux en-têtes détectés qui ne sont pas encore mappés
    if (unmappedRequiredKeys.length > 0) {
      const unmappedHeaders = newHeaders.filter(h => !h.mappedTo);
      
      unmappedRequiredKeys.forEach(requiredKey => {
        if (unmappedHeaders.length > 0) {
          // Trouver le meilleur match pour ce champ obligatoire parmi les en-têtes non mappés
          const requiredField = expectedHeaders.find(h => h.key === requiredKey);
          if (!requiredField) return;
          
          const normalizedRequired = requiredField.label
            .toLowerCase()
            .replace(/\s+/g, '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          let bestHeaderIndex = -1;
          let bestSimilarity = 0;
          
          unmappedHeaders.forEach((unmappedHeader, idx) => {
            const normalizedName = unmappedHeader.name
              .toLowerCase()
              .replace(/\s+/g, '')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
            
            const similarity = stringSimilarity(normalizedName, normalizedRequired);
            
            if (similarity > bestSimilarity) {
              bestSimilarity = similarity;
              bestHeaderIndex = idx;
            }
          });
          
          // S'il y a un match acceptable, l'appliquer
          if (bestSimilarity > 0.5 && bestHeaderIndex >= 0) {
            const headerIndex = unmappedHeaders[bestHeaderIndex].index;
            
            // Mettre à jour l'en-tête avec le mapping
            newHeaders[headerIndex].mappedTo = requiredKey;
            
            // Retirer cet en-tête de la liste des non mappés
            unmappedHeaders.splice(bestHeaderIndex, 1);
          }
        }
      });
      
      // Mettre à jour l'état avec les nouveaux mappings
      setDetectedHeaders([...newHeaders]);
    }
  };

  // Gérer le changement de mapping
  const handleMappingChange = (headerIndex: number, expectedKey: string | null) => {
    // Mettre à jour l'état local
    setDetectedHeaders(prev => prev.map(header =>
      header.index === headerIndex
        ? { ...header, mappedTo: expectedKey }
        : header
    ));
  };

  // Valider le mapping
  const validateMapping = async () => {
    const newMapping: Record<number, string> = {};

    detectedHeaders.forEach(header => {
      if (header.mappedTo) {
        newMapping[header.index] = header.mappedTo;
      }
    });

    setMapping(newMapping);
    
    // Traiter les données selon le mapping
    if (currentFile) {
      try {
        setIsLoading(true);
        
        // Analyser le fichier
        const result = await parseFile(currentFile);
        
        if (result.error) {
          setErrorMessage(`Erreur lors de l'analyse du fichier: ${result.error}`);
          setIsLoading(false);
          return;
        }
        
        // Appliquer le mapping aux données
        const rawData = result.data as any[];
        const processedData = rawData.map(row => {
          const mappedRow: Record<string, any> = {};
          
          // Appliquer le mapping à chaque ligne
          Object.entries(newMapping).forEach(([indexStr, targetField]) => {
            const index = parseInt(indexStr);
            const columnName = detectedHeaders[index]?.name;
            if (columnName && row[columnName] !== undefined) {
              mappedRow[targetField] = row[columnName];
            }
          });
          
          return mappedRow;
        });
        
        // Stocker les données traitées
        setProcessedData(processedData);
        
        // Rediriger vers la page d'export
        router.push('/export');
        
      } catch (err) {
        console.error("Erreur lors du traitement des données:", err);
        setErrorMessage("Impossible de traiter les données du fichier.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Vérifier si tous les champs obligatoires sont mappés
  const areRequiredFieldsMapped = () => {
    const mappedKeys = detectedHeaders
      .filter(h => h.mappedTo)
      .map(h => h.mappedTo);

    return expectedHeaders
      .filter(h => h.required)
      .every(required => mappedKeys.includes(required.key));
  };

  // Générer la liste des en-têtes manquants
  const getMissingRequiredHeaders = () => {
    const mappedKeys = detectedHeaders
      .filter(h => h.mappedTo)
      .map(h => h.mappedTo);

    return expectedHeaders
      .filter(h => h.required && !mappedKeys.includes(h.key))
      .map(h => h.label);
  };

  // Trouver l'en-tête attendu à partir de la clé
  const getExpectedHeader = (key: string | null) => {
    if (!key) return null;
    return expectedHeaders.find(header => header.key === key);
  };

  // Toggle le select ouvert/fermé
  const toggleSelect = (index: number) => {
    setOpenSelects(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Modifier la condition pour tenir compte du store global
  const isFileAvailable = isFileUploaded || (currentFile !== null && detectedColumns.length > 0);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Cartographie des Colonnes du Fichier</h1>

          <div className="flex items-center gap-4">
            <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <HelpCircle size={16} />
                  Aide
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Guide de cartographie des colonnes</DialogTitle>
                  <DialogDescription>
                    Associez chaque colonne de votre fichier à l'un des champs attendus suivants :
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  <h3 className="font-medium text-sm text-red-600">Champs obligatoires :</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {expectedHeaders
                      .filter(h => h.required)
                      .map(header => (
                        <li key={header.key}>
                          <span className="font-medium">{header.label}</span>
                          <p className="text-sm text-gray-600">{header.description}</p>
                        </li>
                      ))}
                  </ul>

                  <h3 className="font-medium text-sm text-yellow-600 mt-4">Champs optionnels :</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {expectedHeaders
                      .filter(h => !h.required)
                      .map(header => (
                        <li key={header.key}>
                          <span className="font-medium">{header.label}</span>
                          <p className="text-sm text-gray-600">{header.description}</p>
                        </li>
                      ))}
                  </ul>
                </div>
              </DialogContent>
            </Dialog>

            {detectedHeaders.length > 0 && (
              <Button
                onClick={validateMapping}
                disabled={!areRequiredFieldsMapped()}
              >
                Valider le mapping
              </Button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {!isFileAvailable ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Importation de fichier</CardTitle>
              <CardDescription>
                Commencez par importer votre fichier CSV ou Excel pour détecter ses colonnes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload 
                onChange={handleFilesChanged}
              />
              {isLoading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-2">Analyse en cours...</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Associez les colonnes de votre fichier</CardTitle>
                <CardDescription>
                  Pour chaque colonne détectée dans votre fichier, sélectionnez le champ correspondant dans le système G4IT.
                  Les champs obligatoires doivent tous être associés pour pouvoir continuer.
                </CardDescription>
              </CardHeader>
            </Card>

            {!areRequiredFieldsMapped() && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Champs obligatoires manquants</h3>
                  <p className="text-sm">
                    Veuillez associer toutes les colonnes obligatoires suivantes :
                  </p>
                  <ul className="list-disc pl-5 mt-1">
                    {getMissingRequiredHeaders().map(header => (
                      <li key={header} className="text-sm">{header}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Nom détecté dans le fichier</TableHead>
                    <TableHead className="w-1/2">Mapper vers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detectedHeaders.map((header) => {
                    const mappedHeader = getExpectedHeader(header.mappedTo);
                    const isMapped = Boolean(header.mappedTo);
                    const isOpen = openSelects.includes(header.index);

                    return (
                      <TableRow key={header.index}>
                        <TableCell className="font-medium">{header.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="relative w-full">
                              <button
                                type="button"
                                onClick={() => toggleSelect(header.index)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
                              >
                                {header.mappedTo
                                  ? expectedHeaders.find(h => h.key === header.mappedTo)?.label
                                  : "Sélectionner un champ..."}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </button>

                              {isOpen && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                                  <div
                                    role="option"
                                    onClick={() => {
                                      handleMappingChange(header.index, null);
                                      toggleSelect(header.index);
                                    }}
                                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100"
                                  >
                                    Ne pas mapper
                                  </div>

                                  {expectedHeaders.map((expected) => (
                                    <div
                                      key={expected.key}
                                      role="option"
                                      onClick={() => {
                                        handleMappingChange(header.index, expected.key);
                                        toggleSelect(header.index);
                                      }}
                                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100"
                                    >
                                      {expected.label} {expected.required ? "(obligatoire)" : "(optionnel)"}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {isMapped && (
                              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <div className="mt-6 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">Champ obligatoire</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600">Champ optionnel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Champ mappé</span>
          </div>
        </div>
      </div>
    </div>
  );
}
