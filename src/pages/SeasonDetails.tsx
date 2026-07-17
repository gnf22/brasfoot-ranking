import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageContainer, PageHeader } from '../components/common/PageContainer';
import { AppCard, AppCardContent } from '../components/common/AppCard';
import { 
  seasonRepository,
  coachTeamRepository,
  coachTitleRepository,
  coachRepository,
  teamRepository,
  competitionRepository,
  competitionWeightRepository
} from '../repositories';
import type { Season, CoachTitle, Coach, Team, Competition } from '../models';

interface CoachSeasonSummary {
  coach: Coach;
  teams: Team[];
  stats: {
    jogos: number;
    vitorias: number;
    empates: number;
    derrotas: number;
  };
  titles: CoachTitle[];
  competitions: Competition[];
  pontos: number;
}

export function SeasonDetails() {
  const { id } = useParams<{ id: string }>();
  
  const [season, setSeason] = useState<Season | null>(null);
  const [summaries, setSummaries] = useState<CoachSeasonSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (seasonId: string) => {
    setIsLoading(true);
    try {
      const s = await seasonRepository.getById(seasonId);
      if (!s) {
        toast.error('Temporada não encontrada');
        setIsLoading(false);
        return;
      }
      setSeason(s);

      const [allPassagens, allTitles, allCoaches, allTeams, allComps, allWeights] = await Promise.all([
        coachTeamRepository.getAll(),
        coachTitleRepository.getAll(),
        coachRepository.getAll(),
        teamRepository.getAll(),
        competitionRepository.getAll(),
        competitionWeightRepository.getAll()
      ]);

      const year = s.anoInicio;

      // 1. Processar quem tem estatísticas no ano
      const passagensDoAno = allPassagens.filter(p => 
        p.estatisticasPorAno?.some(stat => stat.ano === year)
      );

      const summaryMap = new Map<string, CoachSeasonSummary>();

      for (const p of passagensDoAno) {
        const coach = allCoaches.find(c => c.id === p.coachId);
        const team = allTeams.find(t => t.id === p.teamId);
        const stats = p.estatisticasPorAno?.find(stat => stat.ano === year);

        if (coach && team && stats) {
          if (!summaryMap.has(coach.id)) {
            summaryMap.set(coach.id, {
              coach,
              teams: [team],
              stats: { jogos: 0, vitorias: 0, empates: 0, derrotas: 0 },
              titles: [],
              competitions: [],
              pontos: 0
            });
          }
          const existing = summaryMap.get(coach.id)!;
          if (!existing.teams.find(t => t.id === team.id)) {
            existing.teams.push(team);
          }
          existing.stats.jogos += stats.jogos || 0;
          existing.stats.vitorias += stats.vitorias || 0;
          existing.stats.empates += stats.empates || 0;
          existing.stats.derrotas += stats.derrotas || 0;
        }
      }

      // 2. Processar quem tem títulos na temporada
      const titulosDaTemporada = allTitles.filter(t => t.seasonId === seasonId);
      
      for (const titulo of titulosDaTemporada) {
        const coach = allCoaches.find(c => c.id === titulo.coachId);
        const team = allTeams.find(t => t.id === titulo.teamId);
        const comp = allComps.find(c => c.id === titulo.competitionId);
        
        if (coach && team && comp) {
          if (!summaryMap.has(coach.id)) {
            summaryMap.set(coach.id, {
              coach,
              teams: [team],
              stats: { jogos: 0, vitorias: 0, empates: 0, derrotas: 0 },
              titles: [],
              competitions: [],
              pontos: 0
            });
          }
          
          const existing = summaryMap.get(coach.id)!;
          if (!existing.teams.find(t => t.id === team.id)) {
            existing.teams.push(team);
          }
          
          existing.titles.push(titulo);
          existing.competitions.push(comp);
          
          // Pontos por títulos
          const weight = allWeights.find(w => w.competitionId === comp.id);
          if (weight) {
            existing.pontos += weight.pontosTitulo || 0;
          }
        }
      }

      const summaryList = Array.from(summaryMap.values());

      // Ordenar clubes antes de seleções
      summaryList.forEach(summary => {
        summary.teams.sort((a, b) => {
          const tipoA = a.tipo || 'Clube';
          const tipoB = b.tipo || 'Clube';
          if (tipoA === 'Clube' && tipoB === 'Selecao') return -1;
          if (tipoA === 'Selecao' && tipoB === 'Clube') return 1;
          return a.nome.localeCompare(b.nome);
        });
      });

      // Ordenar por pontos, depois aproveitamento, depois vitórias, depois jogos
      const getAprov = (v: number, e: number, j: number) => j > 0 ? ((v * 3 + e) / (j * 3)) * 100 : 0;
      summaryList.sort((a, b) => {
        if (b.pontos !== a.pontos) {
          return b.pontos - a.pontos;
        }
        const aprovA = getAprov(a.stats.vitorias, a.stats.empates, a.stats.jogos);
        const aprovB = getAprov(b.stats.vitorias, b.stats.empates, b.stats.jogos);
        return aprovB - aprovA || b.stats.vitorias - a.stats.vitorias || b.stats.jogos - a.stats.jogos;
      });

      setSummaries(summaryList);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar os dados da temporada');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!season) {
    return <div className="p-8 text-center">Temporada não encontrada.</div>;
  }

  return (
    <PageContainer>
      <PageHeader 
        title={`Resumo: Temporada ${season.descricao}`} 
        description={`Visão geral de todos os técnicos e seus desempenhos no ano de ${season.anoInicio}.`}
        actions={
          <Link 
            to="/seasons"
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        }
      />

      <AppCard>
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold text-lg">Desempenho dos Técnicos no Ano de {season.anoInicio}</h3>
        </div>
        <AppCardContent className="p-0">
          {summaries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhuma estatística de técnico cadastrada para este ano.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase bg-muted/50 border-b tracking-wider">
                  <tr>
                    <th className="px-2 py-1 font-medium text-center w-8">Pos</th>
                    <th className="px-2 py-1 font-medium">Técnico</th>
                    <th className="px-2 py-1 font-medium">Clube / Seleção</th>
                    <th className="px-2 py-1 font-medium text-center">Jogos</th>
                    <th className="px-2 py-1 font-medium text-center">Pontos</th>
                    <th className="px-2 py-1 font-medium text-center">V-E-D (%)</th>
                    <th className="px-2 py-1 font-medium">Títulos na Temporada</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {summaries.map((summary, idx) => {
                    return (
                      <tr key={`${summary.coach.id}-${idx}`} className="hover:bg-muted/50 transition-colors group">
                        <td className="px-2 py-1 text-center font-bold text-[11px] text-muted-foreground group-hover:text-foreground">{idx + 1}º</td>
                        <td className="px-2 py-1">
                          <Link to={`/coaches/${summary.coach.id}`} className="font-semibold text-[12px] text-primary hover:underline block hover:opacity-80 leading-tight">
                            {summary.coach.nome}
                          </Link>
                          <span className="text-[9px] text-muted-foreground">{summary.coach.nacionalidade}</span>
                        </td>
                        <td className="px-2 py-1">
                          <div className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                            {summary.teams.map((t, i) => (
                              <div key={t.id} className="flex items-center gap-1">
                                {i > 0 && <span className="text-muted-foreground/30 font-light mx-0.5">/</span>}
                                {t.escudo && <img src={t.escudo} alt={t.nome} className="w-3.5 h-3.5 object-contain" title={t.nome} />}
                                <span className="font-medium">{t.nome}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-center font-medium text-[12px]">{summary.stats.jogos}</td>
                        <td className="px-2 py-1 text-center font-bold text-primary text-[12px]">{summary.pontos}</td>
                        <td className="px-2 py-1 text-center whitespace-nowrap text-[11px]">
                          <span className="text-green-600 font-medium">{summary.stats.vitorias}</span> - 
                          <span className="text-yellow-600 font-medium"> {summary.stats.empates}</span> - 
                          <span className="text-red-600 font-medium"> {summary.stats.derrotas}</span>
                          {summary.stats.jogos > 0 && (
                            <span className="text-[9px] text-muted-foreground ml-1 font-semibold bg-muted px-1 py-0.5 rounded-sm">
                              {(((summary.stats.vitorias * 3 + summary.stats.empates) / (summary.stats.jogos * 3)) * 100).toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1">
                          {summary.competitions.length === 0 ? (
                            <span className="text-muted-foreground/50 text-[10px]">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {summary.competitions.map((c, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-[9px] font-semibold" title={c.nome}>
                                  {c.logoTrofeu ? (
                                    <img src={c.logoTrofeu} alt="Troféu" className="w-3 h-3 object-contain" />
                                  ) : (
                                    <Trophy className="w-2.5 h-2.5" />
                                  )}
                                  <Link to={`/competitions/${c.id}`} className="hover:underline truncate max-w-[80px]">{c.nome}</Link>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y">
                {summaries.map((summary, idx) => (
                  <div key={`${summary.coach.id}-${idx}`} className="p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                        {idx + 1}º
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <Link to={`/coaches/${summary.coach.id}`} className="font-semibold text-base text-primary hover:underline block leading-tight truncate">
                            {summary.coach.nome}
                          </Link>
                          <span className="font-bold text-base text-primary whitespace-nowrap">{summary.pontos} pt</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            {summary.teams.map((t, i) => (
                              <div key={t.id} className="flex items-center gap-1">
                                {i > 0 && <span className="text-muted-foreground/50 text-[10px]">/</span>}
                                {t.escudo && <img src={t.escudo} alt={t.nome} className="w-3.5 h-3.5 object-contain" />}
                                <span className="truncate max-w-[120px]">{t.nome}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs pl-11">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <span><strong className="text-foreground">{summary.stats.jogos}</strong> J</span>
                        <span className="text-muted-foreground/30">|</span>
                        <span>
                          <strong className="text-green-600">{summary.stats.vitorias}</strong>-
                          <strong className="text-yellow-600">{summary.stats.empates}</strong>-
                          <strong className="text-red-600">{summary.stats.derrotas}</strong>
                        </span>
                        {summary.stats.jogos > 0 && (
                          <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded-md">
                            {(((summary.stats.vitorias * 3 + summary.stats.empates) / (summary.stats.jogos * 3)) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {summary.competitions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-11 mt-1">
                        {summary.competitions.map((c, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[10px] font-semibold" title={c.nome}>
                            {c.logoTrofeu ? (
                              <img src={c.logoTrofeu} alt="Troféu" className="w-3 h-3 object-contain" />
                            ) : (
                              <Trophy className="w-2.5 h-2.5" />
                            )}
                            <Link to={`/competitions/${c.id}`} className="hover:underline truncate max-w-[140px]">{c.nome}</Link>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </AppCardContent>
      </AppCard>

    </PageContainer>
  );
}
