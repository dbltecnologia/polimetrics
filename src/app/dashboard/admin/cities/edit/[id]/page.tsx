
import { AdminHeader } from "@/app/dashboard/admin/_components/AdminHeader";
import { CityForm } from "../../_components/CityForm";
import { getCityById } from "@/services/admin/cities/getCityById";
import { notFound } from 'next/navigation';

interface EditCityPageProps {
  params: {
    id: string;
  };
}

export default async function EditCityPage({ params }: EditCityPageProps) {
  const city = await getCityById(params.id);

  if (!city) {
    notFound();
  }

  return (
    <main className="p-6 md:p-8">
      <AdminHeader 
        title="Editar Cidade"
        subtitle={`Modificando os dados de ${city.name} - ${city.state}.`}
      />
      <div className="mt-8">
        <CityForm city={city} />
      </div>
    </main>
  );
}
