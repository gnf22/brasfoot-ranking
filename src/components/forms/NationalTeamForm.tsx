import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../common/Input';
import type { Team } from '../../models';

const nationalTeamSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  escudo: z.string().optional(),
  corPrimaria: z.string().optional(),
  corSecundaria: z.string().optional(),
  confederacao: z.enum(['CONMEBOL', 'UEFA', 'CONCACAF', 'AFC', 'CAF', 'OFC']),
  ativo: z.boolean(),
});

type NationalTeamFormData = z.infer<typeof nationalTeamSchema>;

interface NationalTeamFormProps {
  initialData?: Partial<Team>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function NationalTeamForm({ initialData, onSubmit, onCancel, isLoading }: NationalTeamFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<NationalTeamFormData>({
    resolver: zodResolver(nationalTeamSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      escudo: initialData?.escudo || '',
      corPrimaria: initialData?.corPrimaria || '#ff0000',
      corSecundaria: initialData?.corSecundaria || '#000000',
      confederacao: (initialData?.confederacao as any) || 'CONMEBOL',
      ativo: initialData?.ativo ?? true,
    }
  });

  const handleFormSubmit = (data: NationalTeamFormData) => {
    onSubmit({ ...data, tipo: 'Selecao' });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Input 
          label="Nome da Seleção" 
          {...register('nome')} 
          error={errors.nome?.message} 
          placeholder="Ex: Brasil"
        />
        <Input 
          label="URL da Bandeira/Escudo" 
          {...register('escudo')} 
          error={errors.escudo?.message} 
        />
        
        <div>
          <label className="block text-sm font-medium mb-1">Confederação</label>
          <select 
            {...register('confederacao')} 
            className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="CONMEBOL">CONMEBOL (América do Sul)</option>
            <option value="UEFA">UEFA (Europa)</option>
            <option value="CONCACAF">CONCACAF (Américas do Norte e Central)</option>
            <option value="AFC">AFC (Ásia)</option>
            <option value="CAF">CAF (África)</option>
            <option value="OFC">OFC (Oceania)</option>
          </select>
          {errors.confederacao && <p className="text-red-500 text-xs mt-1">{errors.confederacao.message}</p>}
        </div>
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
          Seleção Ativa
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
          {isLoading ? 'Salvando...' : 'Salvar Seleção'}
        </button>
      </div>
    </form>
  );
}
