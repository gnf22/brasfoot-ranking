import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../common/Input';
import type { Team } from '../../models';

const teamSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  escudo: z.string().optional(),
  corPrimaria: z.string().optional(),
  corSecundaria: z.string().optional(),
  pais: z.string().min(2, 'País deve ter no mínimo 2 caracteres'),
  ativo: z.boolean(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormProps {
  initialData?: Partial<Team>;
  onSubmit: (data: TeamFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TeamForm({ initialData, onSubmit, onCancel, isLoading }: TeamFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      escudo: initialData?.escudo || '',
      corPrimaria: initialData?.corPrimaria || '#ff0000',
      corSecundaria: initialData?.corSecundaria || '#000000',
      pais: initialData?.pais || '',
      ativo: initialData?.ativo ?? true,
    }
  });

  const handleFormSubmit = (data: TeamFormData) => {
    onSubmit({ ...data, tipo: 'Clube' } as any);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Input 
          label="Nome do Clube" 
          {...register('nome')} 
          error={errors.nome?.message} 
          placeholder="Ex: Clube de Regatas do Flamengo"
        />
        <Input 
          label="URL do Escudo" 
          {...register('escudo')} 
          error={errors.escudo?.message} 
        />
        <Input 
          label="País" 
          {...register('pais')} 
          error={errors.pais?.message} 
          placeholder="Ex: Brasil"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cor Primária</label>
          <input 
            type="color" 
            {...register('corPrimaria')} 
            className="w-full h-10 p-1 rounded border border-input cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cor Secundária</label>
          <input 
            type="color" 
            {...register('corSecundaria')} 
            className="w-full h-10 p-1 rounded border border-input cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input 
          type="checkbox" 
          id="ativo" 
          {...register('ativo')} 
          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
        />
        <label htmlFor="ativo" className="text-sm font-medium leading-none">
          Clube Ativo
        </label>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t mt-6">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-secondary transition-colors text-sm font-medium"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : 'Salvar Clube'}
        </button>
      </div>
    </form>
  );
}
