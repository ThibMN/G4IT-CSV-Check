import { LoaderData } from "@/components/ui/loader-data";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 mx-auto text-center">
        <LoaderData />
        <p className="mt-4 text-gray-500">Chargement des données...</p>
      </div>
    </div>
  );
}
