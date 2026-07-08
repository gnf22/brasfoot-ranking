import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../common/Input';
import type { Coach } from '../../models';

const coachSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  nacionalidade: z.string().min(2, 'Nacionalidade obrigatória'),
  ativo: z.boolean(),
});

type CoachFormData = z.infer<typeof coachSchema>;

interface CoachFormProps {
  initialData?: Partial<Coach>;
  onSubmit: (data: CoachFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CoachForm({ initialData, onSubmit, onCancel, isLoading }: CoachFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CoachFormData>({
    resolver: zodResolver(coachSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      nacionalidade: initialData?.nacionalidade || 'Brasileiro',
      ativo: initialData?.ativo ?? true,
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Nome do Técnico" 
          {...register('nome')} 
          error={errors.nome?.message} 
          placeholder="Ex: Tite"
        />
        <Input 
          label="Nacionalidade" 
          {...register('nacionalidade')} 
          error={errors.nacionalidade?.message} 
        />
        <div className="flex items-center space-x-2 pt-6">
          <input 
            type="checkbox" 
            id="ativo" 
            {...register('ativo')} 
            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
          />
          <label htmlFor="ativo" className="text-sm font-medium leading-none">
            Técnico Ativo
          </label>
        </div>
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
          {isLoading ? 'Salvando...' : 'Salvar Técnico'}
        </button>
      </div>
    </form>
  );
}
