import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import ReactSelect from 'react-select';
import type { TeamTitle, Competition, Season } from '../../models';

const teamTitleSchema = z.object({
  competitionId: z.string().min(1, 'Selecione uma competição'),
  seasonId: z.string().min(1, 'Selecione uma temporada'),
  observacoes: z.string().optional(),
});

type TeamTitleFormData = z.infer<typeof teamTitleSchema>;

interface TeamTitleFormProps {
  initialData?: TeamTitle;
  teamId: string;
  competitions: Competition[];
  seasons: Season[];
  onSubmit: (data: Omit<TeamTitle, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TeamTitleForm({ initialData, teamId, competitions, seasons, onSubmit, onCancel, isLoading }: TeamTitleFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<TeamTitleFormData>({
    resolver: zodResolver(teamTitleSchema),
    defaultValues: initialData || {
      competitionId: '',
      seasonId: '',
      observacoes: ''
    }
  });

  const handleFormSubmit = async (data: TeamTitleFormData) => {
    await onSubmit({
      ...data,
      teamId,
      observacoes: data.observacoes || ''
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Select
          label="Temporada"
          options={seasons.map(s => ({ value: s.id, label: s.descricao }))}
          {...register('seasonId')}
          error={errors.seasonId?.message}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Competição</label>
          <Controller
            name="competitionId"
            control={control}
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={competitions.map(c => ({ value: c.id, label: c.nome }))}
                value={competitions.map(c => ({ value: c.id, label: c.nome })).find(o => o.value === field.value)}
                onChange={(val) => field.onChange(val?.value)}
                placeholder="Selecione ou busque..."
                noOptionsMessage={() => "Nenhuma competição encontrada"}
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                    borderRadius: '0.375rem',
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--input))',
                    '&:hover': { borderColor: 'hsl(var(--ring))' }
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    zIndex: 9999
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'transparent',
                    color: state.isFocused ? 'hsl(var(--accent-foreground))' : 'hsl(var(--popover-foreground))',
                    cursor: 'pointer',
                    '&:active': {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))'
                    }
                  }),
                  singleValue: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
                  input: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
                menuPortalTarget={document.body}
              />
            )}
          />
          {errors.competitionId && <span className="text-xs text-destructive">{errors.competitionId.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Observações"
          {...register('observacoes')}
          error={errors.observacoes?.message}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
