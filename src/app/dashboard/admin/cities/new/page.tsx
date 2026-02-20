
import { AdminHeader } from "@/app/dashboard/admin/_components/AdminHeader";
import { CityForm } from "../_components/CityForm";

export default function NewCityPage() {
  return (
    <main className="p-6 md:p-8">
      <AdminHeader 
        title="Adicionar Nova Cidade"
        subtitle="Preencha os dados da cidade, incluindo suas coordenadas geográficas."
      />
      <div className="mt-8">
        <CityForm />
      </div>
    </main>
  );
}
