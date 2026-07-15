import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ReactSelect from 'react-select';
import { z } from 'zod';
import { Input } from '../common/Input';
import type { CoachTeam, Team, CoachTeamYearStat } from '../../models';
import { createWorker } from 'tesseract.js';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const coachTeamSchema = z.object({
  teamId: z.string().min(1, 'Selecione um clube'),
  anoInicio: z.coerce.number().min(1900, 'Ano inválido'),
  anoFim: z.number().optional().nullable(),
  clubeAtual: z.boolean().default(false),
  observacoes: z.string().optional(),
});

type CoachTeamFormData = z.infer<typeof coachTeamSchema>;

interface CoachTeamFormProps {
  initialData?: CoachTeam;
  coachId: string;
  teams: Team[];
  filter?: 'Clube' | 'Selecao' | 'Todos';
  onSubmit: (data: Omit<CoachTeam, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CoachTeamForm({ initialData, coachId, teams, filter = 'Todos', onSubmit, onCancel, isLoading }: CoachTeamFormProps) {
  const defaultAno = new Date().getFullYear();
  
  const filteredTeams = teams.filter(t => {
    if (filter === 'Clube') return t.tipo !== 'Selecao';
    if (filter === 'Selecao') return t.tipo === 'Selecao';
    return true;
  });

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<CoachTeamFormData>({
    resolver: zodResolver(coachTeamSchema) as any,
    defaultValues: {
      teamId: initialData?.teamId || '',
      anoInicio: initialData?.anoInicio || defaultAno,
      anoFim: initialData?.anoFim || (initialData?.clubeAtual ? null : defaultAno),
      clubeAtual: initialData?.clubeAtual || false,
      observacoes: initialData?.observacoes || ''
    }
  });

  // Estado das estatísticas por ano
  const [statsMap, setStatsMap] = useState<Record<number, CoachTeamYearStat>>({});
  
  // Ano atualmente selecionado no dropdown para edição
  const [selectedYear, setSelectedYear] = useState<number>(initialData?.anoInicio || defaultAno);
  
  // OCR state
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Inicializa o mapa de estatísticas com os dados existentes
  useEffect(() => {
    if (initialData?.estatisticasPorAno) {
      const map: Record<number, CoachTeamYearStat> = {};
      initialData.estatisticasPorAno.forEach(s => {
        map[s.ano] = s;
      });
      setStatsMap(map);
    }
  }, [initialData]);

  const anoInicio = watch('anoInicio');
  const anoFim = watch('anoFim');
  const clubeAtual = watch('clubeAtual');

  const startYear = Number(anoInicio) || defaultAno;
  const endYear = clubeAtual ? new Date().getFullYear() : Number(anoFim || startYear);

  // Gera a lista de anos disponíveis no dropdown
  const availableYears: number[] = [];
  for (let y = startYear; y <= endYear; y++) {
    availableYears.push(y);
  }

  // Se o ano selecionado estiver fora do range, ajusta para o primeiro
  useEffect(() => {
    if (!availableYears.includes(selectedYear) && availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Se marcar clubeAtual, limpa anoFim
  useEffect(() => {
    if (clubeAtual) {
      setValue('anoFim', null);
    }
  }, [clubeAtual, setValue]);

  // Garante que o anoFim não seja menor que o anoInicio
  useEffect(() => {
    if (anoInicio && anoFim && anoInicio > anoFim) {
      setValue('anoFim', anoInicio);
    }
  }, [anoInicio, anoFim, setValue]);

  const handleStatChange = (field: keyof CoachTeamYearStat, value: number) => {
    setStatsMap(prev => {
      const currentStat = prev[selectedYear] || {
        ano: selectedYear, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, golsMarcados: 0, golsSofridos: 0
      };
      return {
        ...prev,
        [selectedYear]: {
          ...currentStat,
          [field]: value
        }
      };
    });
  };

  const currentYearStat = statsMap[selectedYear] || {
    ano: selectedYear, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, golsMarcados: 0, golsSofridos: 0
  };

  const processImage = async (file: File) => {
    if (!file) return;
    setIsAnalyzing(true);
    const toastId = toast.loading('Lendo imagem e baixando dados do OCR...');

    const preprocessImage = (f: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const scale = 2; 
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(URL.createObjectURL(f));
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false; 
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Falha ao carregar imagem no Canvas'));
        img.src = URL.createObjectURL(f);
      });
    };

    try {
      const preprocessedImage = await preprocessImage(file);

      const worker = await createWorker('eng', 1, {
        logger: () => {}
      });
      
      const { data: { text } } = await worker.recognize(preprocessedImage);
      await worker.terminate();
      
      if (!text || text.trim() === '') {
        toast.error('Nenhum texto encontrado na imagem.', { id: toastId });
        setIsAnalyzing(false);
        return;
      }

      const lines = text.split('\n').filter(l => l.trim().length > 0);
      let foundMatch = false;

      const cleanNumericLine = (str: string) => {
        return str
          .replace(/[Oo]/g, '0')
          .replace(/[lI|i]/g, '1')
          .replace(/[Zz]/g, '2')
          .replace(/[Ss]/g, '5')
          .replace(/[B]/g, '8')
          .replace(/[T]/g, '7')
          .replace(/[qg]/g, '9');
      };

      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('tot') || lower.includes('tal')) {
          const idx = lower.indexOf('tot') !== -1 ? lower.indexOf('tot') : lower.indexOf('tal');
          let afterKeyword = line.substring(idx + 3);
          
          afterKeyword = cleanNumericLine(afterKeyword);

          const numbers = afterKeyword.match(/\d+/g);
          if (numbers && numbers.length >= 6) {
            const stats = numbers.slice(-6);
            const [jogos, vitorias, empates, derrotas, golsMarcados, golsSofridos] = stats;
            
            setStatsMap(prev => ({
              ...prev,
              [selectedYear]: {
                ano: selectedYear,
                jogos: Number(jogos),
                vitorias: Number(vitorias),
                empates: Number(empates),
                derrotas: Number(derrotas),
                golsMarcados: Number(golsMarcados),
                golsSofridos: Number(golsSofridos)
              }
            }));

            foundMatch = true;
            toast.success(`Estatísticas de ${selectedYear} lidas com sucesso!`, { id: toastId });
            break;
          }
        }
      }

      if (!foundMatch) {
        const lastLines = lines.slice(-3).reverse();
        for (const line of lastLines) {
          const cleanedLine = cleanNumericLine(line);
          const numbers = cleanedLine.match(/\d+/g);
          
          if (numbers && numbers.length >= 6) {
            const stats = numbers.slice(-6);
            const [jogos, vitorias, empates, derrotas, golsMarcados, golsSofridos] = stats;
            
            setStatsMap(prev => ({
              ...prev,
              [selectedYear]: {
                ano: selectedYear,
                jogos: Number(jogos),
                vitorias: Number(vitorias),
                empates: Number(empates),
                derrotas: Number(derrotas),
                golsMarcados: Number(golsMarcados),
                golsSofridos: Number(golsSofridos)
              }
            }));

            foundMatch = true;
            toast.success(`Estatísticas de ${selectedYear} extraídas (Fallback)!`, { id: toastId });
            break;
          }
        }
      }

      if (!foundMatch) {
        toast.error('Não foi possível identificar 6 números na imagem.', { id: toastId });
      }

    } catch (error) {
      toast.error('Erro ao processar imagem.', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImage(file);
    e.target.value = '';
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Ignorar se o usuário estiver digitando em um input de texto
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.target.type !== 'file') return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processImage(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedYear]); // selectedYear como dependência para usar o ano correto

  const handleFormSubmit = async (data: CoachTeamFormData) => {
    let tJogos = 0, tVitorias = 0, tEmpates = 0, tDerrotas = 0, tGolsM = 0, tGolsS = 0;
    
    // Converte o map em array
    const estatisticasPorAno = Object.values(statsMap);

    estatisticasPorAno.forEach(stat => {
      tJogos += stat.jogos;
      tVitorias += stat.vitorias;
      tEmpates += stat.empates;
      tDerrotas += stat.derrotas;
      tGolsM += stat.golsMarcados;
      tGolsS += stat.golsSofridos;
    });

    const aproveitamento = tJogos > 0 
      ? ((tVitorias * 3 + tEmpates) / (tJogos * 3)) * 100 
      : 0;

    await onSubmit({
      ...data,
      coachId,
      anoFim: data.clubeAtual ? undefined : (data.anoFim || undefined),
      estatisticasPorAno,
      jogos: tJogos,
      vitorias: tVitorias,
      empates: tEmpates,
      derrotas: tDerrotas,
      golsMarcados: tGolsM,
      golsSofridos: tGolsS,
      aproveitamento: parseFloat(aproveitamento.toFixed(2)),
      observacoes: data.observacoes || ''
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Equipe</label>
          <Controller
            name="teamId"
            control={control}
            render={({ field }) => (
              <ReactSelect
                {...field}
                options={filteredTeams.map(t => ({ value: t.id, label: t.nome }))}
                value={filteredTeams.map(t => ({ value: t.id, label: t.nome })).find(c => c.value === field.value)}
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
                  singleValue: (base) => ({
                    ...base,
                    color: 'hsl(var(--foreground))'
                  }),
                  input: (base) => ({
                    ...base,
                    color: 'hsl(var(--foreground))'
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
                menuPortalTarget={document.body}
              />
            )}
          />
          {errors.teamId && <span className="text-xs text-destructive">{errors.teamId.message}</span>}
        </div>
        
        <div className="flex flex-col justify-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              {...register('clubeAtual')}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm font-medium">Clube Atual (Não possui ano fim)</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Ano de Início"
          type="number"
          {...register('anoInicio')}
          error={errors.anoInicio?.message as string}
        />
        <Input
          label="Ano de Fim"
          type="number"
          {...register('anoFim', {
            setValueAs: v => (v === "" || Number.isNaN(parseInt(v, 10))) ? null : parseInt(v, 10)
          })}
          disabled={clubeAtual}
          error={errors.anoFim?.message as string}
        />
      </div>

      <div className="border rounded-md p-4 bg-muted/10 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Estatísticas por Ano</h4>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Editar temporada:</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 border rounded-md text-sm bg-background"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            
            <div className="h-6 w-px bg-border mx-2" />
            
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                disabled={isAnalyzing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                title="Extrair dados de uma imagem (OCR)"
              />
              <button 
                type="button" 
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-md text-sm font-medium disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                {isAnalyzing ? 'Lendo...' : 'Ler Imagem'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Jogos</label>
            <input 
              type="number" 
              value={currentYearStat.jogos}
              onChange={(e) => handleStatChange('jogos', Number(e.target.value))}
              className="w-full px-2 py-1.5 border rounded-md text-sm text-center"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Vitórias</label>
            <input 
              type="number" 
              value={currentYearStat.vitorias}
              onChange={(e) => handleStatChange('vitorias', Number(e.target.value))}
              className="w-full px-2 py-1.5 border rounded-md text-sm text-center"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Empates</label>
            <input 
              type="number" 
              value={currentYearStat.empates}
              onChange={(e) => handleStatChange('empates', Number(e.target.value))}
              className="w-full px-2 py-1.5 border rounded-md text-sm text-center"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Derrotas</label>
            <input 
              type="number" 
              value={currentYearStat.derrotas}
              onChange={(e) => handleStatChange('derrotas', Number(e.target.value))}
              className="w-full px-2 py-1.5 border rounded-md text-sm text-center"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Gols Pró</label>
            <input 
              type="number" 
              value={currentYearStat.golsMarcados}
              onChange={(e) => handleStatChange('golsMarcados', Number(e.target.value))}
              className="w-full px-2 py-1.5 border rounded-md text-sm text-center"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Gols Sof</label>
            <input 
              type="number" 
              value={currentYearStat.golsSofridos}
              onChange={(e) => handleStatChange('golsSofridos', Number(e.target.value))}
              className="w-full px-2 py-1.5 border rounded-md text-sm text-center"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Observações"
          {...register('observacoes')}
          error={errors.observacoes?.message as string}
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
