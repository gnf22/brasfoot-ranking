import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, X, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { PageContainer } from '../components/common/PageContainer';
import { AppCard, AppCardContent } from '../components/common/AppCard';
import { Modal } from '../components/common/Modal';
import { TeamTitleForm } from '../components/forms/TeamTitleForm';
import { 
  teamRepository,
  coachTeamRepository,
  coachTitleRepository,
  teamTitleRepository,
  coachRepository,
  competitionRepository,
  seasonRepository
} from '../repositories';
import type { Team, CoachTitle, TeamTitle, Coach, Competition, Season } from '../models';

interface SeasonData {
  season: Season;
  coaches: {
    coach: Coach;
    stats: any; // CoachTeamYearStat
    titles: { title: CoachTitle; competition: Competition }[];
  }[];
  aiTitles: { title: TeamTitle; competition: Competition }[];
}

export function TeamDetails() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [seasonsData, setSeasonsData] = useState<SeasonData[]>([]);
  const [allTitles, setAllTitles] = useState<{ title: CoachTitle | TeamTitle; competition: Competition; coach?: Coach; season: Season }[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isTeamTitleModalOpen, setIsTeamTitleModalOpen] = useState(false);
  const [editingTeamTitle, setEditingTeamTitle] = useState<TeamTitle | undefined>();
  
  const [hallModalData, setHallModalData] = useState<{ comp: Competition, titles: { title: CoachTitle | TeamTitle; coach?: Coach; season: Season }[] } | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (teamId: string) => {
    setIsLoading(true);
    try {
      const t = await teamRepository.getById(teamId);
      if (!t) {
        toast.error('Clube não encontrado');
        setIsLoading(false);
        return;
      }
      setTeam(t);

      const [passagens, titles, aiTitlesRaw, coaches, comps, seasonsData] = await Promise.all([
        coachTeamRepository.getAll(),
        coachTitleRepository.getAll(),
        teamTitleRepository.getByTeamId(teamId),
        coachRepository.getAll(),
        competitionRepository.getAll(),
        seasonRepository.getAll()
      ]);

      setCompetitions(comps);
      setSeasons(seasonsData);

      // Filtra passagens por este clube
      const teamPassagens = passagens.filter(p => p.teamId === teamId);
      // Filtra títulos ganhos por este clube
      const teamTitles = titles.filter(t => t.teamId === teamId);

      // Prepara lista de todos os títulos do clube (Técnicos + IA)
      const titlesList: { title: CoachTitle | TeamTitle; competition: Competition; coach?: Coach; season: Season }[] = [];
      
      teamTitles.forEach(t => {
        const comp = comps.find(c => c.id === t.competitionId);
        const coach = coaches.find(c => c.id === t.coachId);
        const season = seasonsData.find(s => s.id === t.seasonId);
        if (comp && coach && season) titlesList.push({ title: t, competition: comp, coach, season });
      });

      aiTitlesRaw.forEach(t => {
        const comp = comps.find(c => c.id === t.competitionId);
        const season = seasonsData.find(s => s.id === t.seasonId);
        if (comp && season) titlesList.push({ title: t, competition: comp, season });
      });

      setAllTitles(titlesList.sort((a, b) => b.season.anoInicio - a.season.anoInicio));

      // Prepara lista temporada a temporada
      const seasonsMap = new Map<string, SeasonData>();

      // Primeiro, popula todas as temporadas ativas
      for (const season of seasonsData) {
        const year = season.anoInicio;
        
        // Acha técnicos que atuaram neste ano neste clube
        const passagensDoAno = teamPassagens.filter(p => p.estatisticasPorAno?.some(s => s.ano === year));
        const aiTitlesInSeason = aiTitlesRaw.filter(t => t.seasonId === season.id);
        
        if (passagensDoAno.length > 0 || aiTitlesInSeason.length > 0) {
          const seasonCoaches = passagensDoAno.map(p => {
            const coach = coaches.find(c => c.id === p.coachId)!;
            const stats = p.estatisticasPorAno.find(s => s.ano === year)!;
            const coachTitlesInSeason = teamTitles.filter(t => t.coachId === p.coachId && t.seasonId === season.id);
            const titlesData = coachTitlesInSeason.map(t => ({
              title: t,
              competition: comps.find(c => c.id === t.competitionId)!
            })).filter(t => t.competition);

            return { coach, stats, titles: titlesData };
          }).filter(c => c.coach);

          const aiTitlesData = aiTitlesInSeason.map(t => ({
            title: t,
            competition: comps.find(c => c.id === t.competitionId)!
          })).filter(t => t.competition);

          seasonsMap.set(season.id, {
            season,
            coaches: seasonCoaches,
            aiTitles: aiTitlesData
          });
        }
      }

      setSeasonsData(Array.from(seasonsMap.values()).sort((a, b) => b.season.anoInicio - a.season.anoInicio));

    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar os dados do clube');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTeamTitle = async (data: Omit<TeamTitle, 'id'>) => {
    try {
      if (editingTeamTitle) {
        await teamTitleRepository.update(editingTeamTitle.id, data);
        toast.success('Título da IA atualizado!');
      } else {
        await teamTitleRepository.create(data);
        toast.success('Título da IA adicionado!');
      }
      setIsTeamTitleModalOpen(false);
      if (id) loadData(id);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar título da IA');
    }
  };

  const handleDeleteTeamTitle = async (titleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este título da IA?')) {
      try {
        await teamTitleRepository.delete(titleId);
        toast.success('Título excluído!');
        if (id) loadData(id);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir título');
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!team) {
    return <div className="p-8 text-center">Clube não encontrado.</div>;
  }

  // Agrupar títulos para o Hall de Títulos
  const hallDeTitulos = allTitles.reduce((acc, t) => {
    if (!acc[t.competition.id]) acc[t.competition.id] = [];
    acc[t.competition.id].push(t);
    return acc;
  }, {} as Record<string, { title: CoachTitle | TeamTitle; coach?: Coach; season: Season; competition: Competition }[]>);

  const hallItems = Object.entries(hallDeTitulos).map(([_, list]) => {
    const comp = list[0].competition;
    return { comp, list };
  }).filter(item => item.comp).sort((a, b) => {
    const compOrder: Record<string, number> = {
      'Mundial': 1,
      'Continental': 2,
      'Nacional': 3,
      'Copa': 4,
      'Supercopa': 5
    };
    const orderA = compOrder[a.comp.tipo] || 99;
    const orderB = compOrder[b.comp.tipo] || 99;
    
    if (orderA === orderB) {
      return a.comp.nome.localeCompare(b.comp.nome);
    }
    
    return orderA - orderB;
  });

  return (
    <PageContainer>
      {/* Header com as cores do time */}
      <div 
        className="rounded-xl overflow-hidden mb-6 shadow-sm border"
        style={{ 
          background: `linear-gradient(135deg, ${team.corPrimaria || '#333'} 0%, ${team.corSecundaria || '#111'} 100%)`,
          color: '#fff'
        }}
      >
        <div className="p-8 flex items-center gap-6 bg-black/20 backdrop-blur-sm">
          {team.escudo ? (
            <img src={team.escudo} alt={team.nome} className="w-24 h-24 object-contain bg-white/10 rounded-full p-2" />
          ) : (
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {team.nome.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 text-white/70 mb-2">
              <Link to="/teams" className="hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{team.nome}</h1>
            {team.pais && (
              <p className="text-white/80 font-medium text-lg flex items-center gap-2">
                {team.pais}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 text-white/90">
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${team.ativo ? 'bg-green-500/20 text-green-100 border border-green-500/30' : 'bg-red-500/20 text-red-100 border border-red-500/30'}`}>
                {team.ativo ? 'Clube Ativo' : 'Clube Inativo'}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-yellow-500/20 text-yellow-100 border border-yellow-500/30 flex items-center gap-1.5 uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" />
                {allTitles.length} {allTitles.length === 1 ? 'Título Oficial' : 'Títulos Oficiais'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HALL DE TÍTULOS */}
      {hallItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Hall de Títulos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {hallItems.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setHallModalData({ comp: item.comp!, titles: item.list })}
                className="bg-card border rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all shadow-sm hover:shadow-md"
              >
                {item.comp?.logoTrofeu ? (
                  <img src={item.comp.logoTrofeu} alt="Troféu" className="w-16 h-16 object-contain" />
                ) : (
                  <Trophy className="w-12 h-12 text-yellow-500" />
                )}
                <div className="text-center">
                  <p className="font-bold text-lg leading-tight">{item.list.length}x</p>
                  <p className="text-xs text-muted-foreground mt-1 px-1">{item.comp?.nome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Temporada a Temporada</h2>
          
          {seasonsData.length === 0 ? (
            <AppCard>
              <div className="p-8 text-center text-muted-foreground">
                Nenhum dado registrado para este clube.
              </div>
            </AppCard>
          ) : (
            <div className="space-y-4">
              {seasonsData.map(sd => (
                <AppCard key={sd.season.id}>
                  <div className="p-4 border-b bg-muted/20">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Link to={`/seasons/${sd.season.id}`} className="hover:underline text-primary">
                        Temporada {sd.season.anoInicio}
                      </Link>
                    </h3>
                  </div>
                  <AppCardContent className="p-0">
                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 border-b">
                          <tr>
                            <th className="px-4 py-3 font-medium w-[30%]">Técnico</th>
                            <th className="px-4 py-3 font-medium text-center w-[15%]">Jogos</th>
                            <th className="px-4 py-3 font-medium text-center w-[20%]">V-E-D (%)</th>
                            <th className="px-4 py-3 font-medium w-[35%]">Títulos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {sd.coaches.map((c, idx) => (
                            <tr key={idx} className="hover:bg-muted/50">
                              <td className="px-4 py-3">
                                <Link to={`/coaches/${c.coach.id}`} className="font-semibold text-primary hover:underline whitespace-nowrap">
                                  {c.coach.nome}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-center">{c.stats.jogos}</td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span className="text-green-600">{c.stats.vitorias}</span> - 
                                <span className="text-yellow-600"> {c.stats.empates}</span> - 
                                <span className="text-red-600"> {c.stats.derrotas}</span>
                                {c.stats.jogos > 0 && (
                                  <span className="text-xs text-muted-foreground ml-2 font-medium">
                                    ({(((c.stats.vitorias * 3 + c.stats.empates) / (c.stats.jogos * 3)) * 100).toFixed(1)}%)
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {c.titles.map((t, tidx) => (
                                    <span key={tidx} className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-md text-xs font-medium" title={t.competition.nome}>
                                      {t.competition.logoTrofeu ? (
                                        <img src={t.competition.logoTrofeu} alt="Troféu" className="w-4 h-4 object-contain" />
                                      ) : (
                                        <Trophy className="w-3.5 h-3.5" />
                                      )}
                                      <Link to={`/competitions/${t.competition.id}`} className="hover:underline">{t.competition.nome}</Link>
                                    </span>
                                  ))}
                                  {c.titles.length === 0 && <span className="text-muted-foreground">-</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="md:hidden divide-y">
                      {sd.coaches.map((c, idx) => (
                        <div key={idx} className="p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <Link to={`/coaches/${c.coach.id}`} className="font-semibold text-lg text-primary hover:underline block leading-tight">
                              {c.coach.nome}
                            </Link>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                            <div>
                              <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-0.5">Jogos</span>
                              <span className="font-medium text-lg">{c.stats.jogos}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-0.5">V-E-D (%)</span>
                              <span className="font-medium text-sm">
                                <span className="text-green-600">{c.stats.vitorias}</span> - 
                                <span className="text-yellow-600"> {c.stats.empates}</span> - 
                                <span className="text-red-600"> {c.stats.derrotas}</span>
                                {c.stats.jogos > 0 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({(((c.stats.vitorias * 3 + c.stats.empates) / (c.stats.jogos * 3)) * 100).toFixed(1)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-1">
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-1.5">Títulos</span>
                            <div className="flex flex-wrap gap-2">
                              {c.titles.map((t, tidx) => (
                                <span key={tidx} className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-medium" title={t.competition.nome}>
                                  {t.competition.logoTrofeu ? (
                                    <img src={t.competition.logoTrofeu} alt="Troféu" className="w-3.5 h-3.5 object-contain" />
                                  ) : (
                                    <Trophy className="w-3 h-3" />
                                  )}
                                  <Link to={`/competitions/${t.competition.id}`} className="hover:underline">{t.competition.nome}</Link>
                                </span>
                              ))}
                              {c.titles.length === 0 && <span className="text-muted-foreground text-sm">-</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* AI Titles */}
                    {sd.aiTitles && sd.aiTitles.length > 0 && (
                      <div className="bg-muted/10 p-4 border-t">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-primary mb-1">Títulos conquistados pela IA</p>
                            <div className="flex flex-wrap gap-2">
                              {sd.aiTitles.map((t, tidx) => (
                                <span key={tidx} className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-medium" title={t.competition.nome}>
                                  {t.competition.logoTrofeu ? (
                                    <img src={t.competition.logoTrofeu} alt="Troféu" className="w-3.5 h-3.5 object-contain" />
                                  ) : (
                                    <Trophy className="w-3 h-3" />
                                  )}
                                  <Link to={`/competitions/${t.competition.id}`} className="hover:underline">{t.competition.nome}</Link>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </AppCardContent>
                </AppCard>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Lista de Títulos</h2>
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingTeamTitle(undefined);
                  setIsTeamTitleModalOpen(true);
                }}
                className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium bg-primary/10 px-3 py-1.5 rounded-md"
              >
                <Plus className="w-4 h-4" /> Adicionar Título (IA)
              </button>
            )}
          </div>
          <AppCard>
            <AppCardContent className="p-0">
              {allTitles.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Nenhum título registrado.
                </div>
              ) : (
                <div className="divide-y">
                  {allTitles.map((t, idx) => (
                    <div key={idx} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-muted rounded-full overflow-hidden">
                        {t.competition.logoTrofeu ? (
                          <img src={t.competition.logoTrofeu} alt="Troféu" className="w-8 h-8 object-contain" />
                        ) : (
                          <Trophy className="w-6 h-6 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">
                          <Link to={`/competitions/${t.competition.id}`} className="hover:underline text-primary">
                            {t.competition.nome}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.season.anoInicio} - {t.coach ? (
                            <Link to={`/coaches/${t.coach.id}`} className="hover:underline text-primary">{t.coach.nome}</Link>
                          ) : (
                            <span className="italic">Conquistado pela IA</span>
                          )}
                        </p>
                      </div>
                      
                      {isAdmin && !t.coach && (
                        <div className="flex justify-end gap-2 shrink-0">
                          <button 
                            onClick={() => { setEditingTeamTitle(t.title as TeamTitle); setIsTeamTitleModalOpen(true); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar Título da IA"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeamTitle(t.title.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AppCardContent>
          </AppCard>
        </div>
      </div>

      {/* MODAL HALL DE TÍTULOS DETALHES */}
      {hallModalData && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-4">
                {hallModalData.comp.logoTrofeu ? (
                  <img src={hallModalData.comp.logoTrofeu} alt="Troféu" className="w-12 h-12 object-contain" />
                ) : (
                  <Trophy className="w-8 h-8 text-yellow-500" />
                )}
                <div>
                  <h2 className="text-xl font-bold">{hallModalData.comp.nome}</h2>
                  <p className="text-sm text-muted-foreground">{hallModalData.titles.length} conquista(s)</p>
                </div>
              </div>
              <button 
                onClick={() => setHallModalData(null)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 max-h-[400px] overflow-y-auto">
              <div className="divide-y">
                {hallModalData.titles.map((t, idx) => {
                  return (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          {t.coach ? (
                            <p className="font-semibold text-sm">
                              <Link to={`/coaches/${t.coach.id}`} className="hover:underline text-primary">
                                {t.coach.nome}
                              </Link>
                            </p>
                          ) : (
                            <p className="font-semibold text-sm italic text-muted-foreground">
                              Conquistado pela IA
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">Temporada {t.season.descricao}</p>
                        </div>
                      </div>
                      <div className="font-bold text-lg text-primary">
                        {t.season.anoInicio}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isTeamTitleModalOpen}
        onClose={() => setIsTeamTitleModalOpen(false)}
        title={editingTeamTitle ? 'Editar Título (IA)' : 'Novo Título (IA)'}
      >
        <TeamTitleForm
          initialData={editingTeamTitle}
          teamId={id || ''}
          competitions={competitions.filter(c => c.tipo !== 'Seleções')}
          seasons={seasons}
          onSubmit={handleSaveTeamTitle}
          onCancel={() => setIsTeamTitleModalOpen(false)}
        />
      </Modal>

    </PageContainer>
  );
}
