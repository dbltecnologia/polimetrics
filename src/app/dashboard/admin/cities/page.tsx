
import { getAllCities } from "@/services/admin/cities/getAllCities";
import { getCitiesOverview } from "@/services/admin/cities/getCitiesOverview";
import { AdminHeader } from "@/app/dashboard/admin/_components/AdminHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CitiesTable } from "./_components/CitiesTable";

export const revalidate = 0; // Force dynamic rendering

export default async function AdminCitiesPage() {
  
  const [cities, overview] = await Promise.all([
    getAllCities(),
    getCitiesOverview(),
  ]);

  return (
    <main className="space-y-6">
      <AdminHeader 
        title="Gerenciar Cidades"
        subtitle="Cadastre e edite as cidades para o mapa político."
      >
        <Link href="/dashboard/admin/cities/new">
          <Button>Adicionar Cidade</Button>
        </Link>
      </AdminHeader>

      <div className="-mx-4 sm:-mx-6 lg:-mx-8 border sm:rounded-lg overflow-hidden">
        {cities.length > 0 ? (
          <CitiesTable cities={cities} overview={overview} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>Nenhuma cidade cadastrada ainda.</p>
            <p>Clique em &quot;Adicionar Cidade&quot; para começar.</p>
          </div>
        )}
      </div>
    </main>
  );
}
