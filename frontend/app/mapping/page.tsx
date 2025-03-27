"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, HelpCircle, CheckCircle, ChevronDown } from "lucide-react";
import { useHeaderMappingStore } from "@/store/header-mapping-store";
import Navbar from "@/components/layout/navbar";

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
    description: "Le modèle exact de l'équipement"
  },
  {
    key: "quantite",
    label: "Quantité",
    required: true,
    description: "Le nombre d'unités de cet équipement"
  },
  {
    key: "dateAchat",
    label: "Date d'achat",
    required: false,
    description: "La date à laquelle l'équipement a été acquis (format JJ/MM/AAAA)"
  },
  {
    key: "statut",
    label: "Statut",
    required: false,
    description: "L'état actuel de l'équipement (ex: en service, en maintenance, hors service)"
  },
];

export default function HeaderMapping() {
  // États locaux
  const [detectedHeaders, setDetectedHeaders] = useState<DetectedHeader[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [openSelects, setOpenSelects] = useState<number[]>([]);

  // Zustand store pour sauvegarder le mapping
  const { setMapping, mapping } = useHeaderMappingStore();

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
  const validateMapping = () => {
    const newMapping: Record<number, string> = {};

    detectedHeaders.forEach(header => {
      if (header.mappedTo) {
        newMapping[header.index] = header.mappedTo;
      }
    });

    setMapping(newMapping);
    alert("Mapping sauvegardé avec succès !");
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

            <Button
              onClick={validateMapping}
              disabled={!areRequiredFieldsMapped()}
            >
              Valider le mapping
            </Button>
          </div>
        </div>

        {!areRequiredFieldsMapped() && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
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
