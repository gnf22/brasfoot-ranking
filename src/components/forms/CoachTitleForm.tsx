import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import ReactSelect from 'react-select';
import type { CoachTitle, Team, Competition, Season, CoachTeam } from '../../models';

const coachTitleSchema = z.object({
  teamId: z.string().min(1, 'Selecione um clube'),
  competitionId: z.string().min(1, 'Selecione uma competição'),
  seasonId: z.string().min(1, 'Selecione uma temporada'),
  observacoes: z.string().optional(),
});

type CoachTitleFormData = z.infer<typeof coachTitleSchema>;

interface CoachTitleFormProps {
  initialData?: CoachTitle;
  coachId: string;
  teams: Team[];
  competitions: Competition[];
  seasons: Season[];
  passagens: CoachTeam[];
  onSubmit: (data: Omit<CoachTitle, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CoachTitleForm({ initialData, coachId, teams, competitions, seasons, passagens, onSubmit, onCancel, isLoading }: CoachTitleFormProps) {
  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<CoachTitleFormData>({
    resolver: zodResolver(coachTitleSchema),
    defaultValues: initialData || {
      teamId: '',
      competitionId: '',
      seasonId: '',
      observacoes: ''
    }
  });

  const selectedSeasonId = watch('seasonId');

  const filteredTeams = useMemo(() => {
    if (!selectedSeasonId) return teams;

    const season = seasons.find(s => s.id === selectedSeasonId);
    if (!season) return teams;

    const passagensNoAno = passagens.filter(p => {
      const seasonYear = season.anoInicio;
      if (p.clubeAtual) {
        return seasonYear >= p.anoInicio;
      }
      return seasonYear >= p.anoInicio && seasonYear <= (p.anoFim || p.anoInicio);
    });
    
    if (passagensNoAno.length === 0) return teams;

    const teamIds = passagensNoAno.map(p => p.teamId);
    return teams.filter(t => teamIds.includes(t.id));
  }, [selectedSeasonId, seasons, passagens, teams]);

  const selectedTeamId = watch('teamId');
  
  const filteredCompetitions = useMemo(() => {
    if (!selectedTeamId) return competitions;
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return competitions;
    
    if (team.tipo === 'Selecao') {
      return competitions.filter(c => c.tipo === 'Seleções');
    } else {
      return competitions.filter(c => c.tipo !== 'Seleções');
    }
  }, [selectedTeamId, teams, competitions]);

  // Auto-selecionar o primeiro clube da lista filtrada quando a temporada mudar
  useEffect(() => {
    if (selectedSeasonId && filteredTeams.length > 0) {
      // Se tiver times válidos, seleciona o primeiro por padrão
      setValue('teamId', filteredTeams[0].id, { shouldValidate: true });
    }
  }, [selectedSeasonId]); // Roda apenas quando selectedSeasonId mudar

  const handleFormSubmit = async (data: CoachTitleFormData) => {
    await onSubmit({
      ...data,
      coachId,
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Competição</label>
          <Controller
            name="competitionId"
            control={control}
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={filteredCompetitions.map(c => ({ value: c.id, label: c.nome }))}
                value={filteredCompetitions.map(c => ({ value: c.id, label: c.nome })).find(o => o.value === field.value)}
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Clube / Seleção</label>
          <Controller
            name="teamId"
            control={control}
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={filteredTeams.map(t => ({ value: t.id, label: t.nome }))}
                value={filteredTeams.map(t => ({ value: t.id, label: t.nome })).find(o => o.value === field.value)}
                onChange={(val) => field.onChange(val?.value)}
                placeholder="Selecione ou busque..."
                noOptionsMessage={() => "Nenhuma equipe encontrada"}
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
          {errors.teamId && <span className="text-xs text-destructive">{errors.teamId.message}</span>}
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
