
'use client'

import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import { Leader } from '@/types/leader';

interface LeaderOption {
  value: string;
  label: string;
}

interface NewLeaderFormProps {
  leaders: Leader[];
}

/**
 * Este é um Componente de Cliente que contém toda a lógica interativa do formulário.
 * Ele recebe os dados dos líderes (buscados no servidor) como uma prop.
 */
export default function NewLeaderForm({ leaders }: NewLeaderFormProps) {
  const { control, handleSubmit } = useForm();

  const leaderOptions: LeaderOption[] = leaders.map(leader => ({
    value: leader.id,
    label: leader.user?.name || 'Nome não disponível'
  }));

  const onSubmit = (data: any) => {
    console.log('Dados do formulário:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="leader-select" className="block text-sm font-medium text-gray-700">Selecione o Líder</label>
        <Controller
          name="leader"
          control={control}
          render={({ field }) => (
              <Select
                  {...field}
                  id="leader-select"
                  options={leaderOptions}
                  isClearable
                  isSearchable
                  placeholder="Selecione um líder para vincular..."
              />
          )}
        />
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
    </form>
  );
}
