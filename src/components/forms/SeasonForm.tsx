import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../common/Input';
import type {  Season  } from '../../models';

const formSchema = z.object({
  ano: z.number().min(1900).max(2100, 'Ano inválido'),
  ativa: z.boolean(),
});

type FormInputData = z.infer<typeof formSchema>;

interface SeasonFormProps {
  initialData?: Partial<Season>;
  onSubmit: (data: Omit<Season, 'id'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SeasonForm({ initialData, onSubmit, onCancel, isLoading }: SeasonFormProps) {
  const currentYear = new Date().getFullYear();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormInputData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ano: initialData?.anoInicio || currentYear,
      ativa: initialData?.ativa ?? true,
    }
  });

  const handleFormSubmit = (data: FormInputData) => {
    onSubmit({
      descricao: data.ano.toString(),
      anoInicio: data.ano,
      anoFim: data.ano,
      ativa: data.ativa
    } as any);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Input 
          label="Ano da Temporada" 
          type="number"
          {...register('ano', { valueAsNumber: true })} 
          error={errors.ano?.message} 
        />
        <div className="flex items-center space-x-2 pt-2">
          <input 
            type="checkbox" 
            id="ativa" 
            {...register('ativa')}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="ativa" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Temporada Ativa
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
          {isLoading ? 'Salvando...' : 'Salvar Temporada'}
        </button>
      </div>
    </form>
  );
}
