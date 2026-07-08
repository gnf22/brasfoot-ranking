import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import type { Competition } from '../../models';

const competitionSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  tipo: z.enum(['Seleções', 'Mundial', 'Continental', 'Nacional', 'Copa', 'Supercopa']),
  continente: z.string().optional(),
  pais: z.string().optional(),
  logo: z.string().optional(),
  logoTrofeu: z.string().optional(),
  ativo: z.boolean(),
});

type CompetitionFormData = z.infer<typeof competitionSchema>;

interface CompetitionFormProps {
  initialData?: Partial<Competition>;
  onSubmit: (data: CompetitionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CompetitionForm({ initialData, onSubmit, onCancel, isLoading }: CompetitionFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      tipo: initialData?.tipo || 'Nacional',
      continente: initialData?.continente || 'América do Sul',
      pais: initialData?.pais || 'Brasil',
      logo: initialData?.logo || '',
      logoTrofeu: initialData?.logoTrofeu || '',
      ativo: initialData?.ativo ?? true,
    }
  });

  const selectedTipo = watch('tipo');
  const showContinente = selectedTipo !== 'Mundial';
  const showPais = selectedTipo !== 'Mundial' && selectedTipo !== 'Continental';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Nome da Competição" 
          {...register('nome')} 
          error={errors.nome?.message} 
          placeholder="Ex: Campeonato Brasileiro"
        />
        <Select 
          label="Tipo" 
          {...register('tipo')} 
          error={errors.tipo?.message} 
          options={[
            { value: 'Seleções', label: 'Seleções' },
            { value: 'Mundial', label: 'Mundial' },
            { value: 'Continental', label: 'Continental' },
            { value: 'Nacional', label: 'Nacional' },
            { value: 'Copa', label: 'Copa' },
            { value: 'Supercopa', label: 'Supercopa' },
          ]}
        />
        
        {showContinente && (
          <Input 
            label="Continente" 
            {...register('continente')} 
            error={errors.continente?.message} 
            placeholder="Ex: América do Sul"
          />
        )}
        
        {showPais && (
          <Input 
            label="País" 
            {...register('pais')} 
            error={errors.pais?.message} 
            placeholder="Ex: Brasil"
          />
        )}

        <Input 
          label="URL do Logo" 
          {...register('logo')} 
          error={errors.logo?.message} 
        />
        <Input 
          label="URL do Troféu" 
          {...register('logoTrofeu')} 
          error={errors.logoTrofeu?.message} 
        />
        <div className="flex items-center space-x-2 pt-6">
          <input 
            type="checkbox" 
            id="ativo" 
            {...register('ativo')} 
            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
          />
          <label htmlFor="ativo" className="text-sm font-medium leading-none">
            Competição Ativa
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
          {isLoading ? 'Salvando...' : 'Salvar Competição'}
        </button>
      </div>
    </form>
  );
}
