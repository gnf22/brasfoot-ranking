import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Trophy, X, ArrowDownCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { PageContainer, PageHeader } from '../components/common/PageContainer';
import { AppCard, AppCardContent } from '../components/common/AppCard';
import { Modal } from '../components/common/Modal';
import { CoachTeamForm } from '../components/forms/CoachTeamForm';
import { CoachTitleForm } from '../components/forms/CoachTitleForm';
import { CoachRelegationForm } from '../components/forms/CoachRelegationForm';
import { 
  coachRepository, 
  coachTeamRepository, 
  coachTitleRepository,
  coachRelegationRepository,
  teamRepository,
  competitionRepository,
  seasonRepository
} from '../repositories';
import type { Coach, CoachTeam, CoachTitle, CoachRelegation, Team, Competition, Season } from '../models';

export function CoachDetails() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  
  const [coach, setCoach] = useState<Coach | null>(null);
  const [passagens, setPassagens] = useState<CoachTeam[]>([]);
  const [titulos, setTitulos] = useState<CoachTitle[]>([]);
  const [rebaixamentos, setRebaixamentos] = useState<CoachRelegation[]>([]);
  
  // Reference data for dropdowns
  const [teams, setTeams] = useState<Team[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [isRelegationModalOpen, setIsRelegationModalOpen] = useState(false);
  const [hallModalData, setHallModalData] = useState<{ comp: Competition, titles: CoachTitle[] } | null>(null);
  
  const [editingTeam, setEditingTeam] = useState<CoachTeam | undefined>();
  const [editingTitle, setEditingTitle] = useState<CoachTitle | undefined>();
  const [editingRelegation, setEditingRelegation] = useState<CoachRelegation | undefined>();
  const [teamModalFilter, setTeamModalFilter] = useState<'Clube' | 'Selecao' | 'Todos'>('Todos');

  // Drag to scroll for Hall de Títulos
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(walk) > 5) setDragMoved(true);
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleCardClick = (item: { comp: Competition, list: CoachTitle[] }) => {
    if (dragMoved) return;
    setHallModalData({ comp: item.comp, titles: item.list });
  };

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (coachId: string) => {
    setIsLoading(true);
    try {
      const [
        coachData, 
        passagensData, 
        titulosData, 
        rebaixamentosData,
        teamsData, 
        compsData, 
        seasonsData
      ] = await Promise.all([
        coachRepository.getById(coachId),
        coachTeamRepository.getByCoachId(coachId),
        coachTitleRepository.getByCoachId(coachId),
        coachRelegationRepository.getByCoachId(coachId),
        teamRepository.getAll(),
        competitionRepository.getAll(),
        seasonRepository.getAll()
      ]);

      setCoach(coachData);
      setPassagens(passagensData);
      setTitulos(titulosData);
      setRebaixamentos(rebaixamentosData);
      setTeams(teamsData);
      setCompetitions(compsData);
      setSeasons(seasonsData);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados do técnico');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers para Passagens (CoachTeam) ---
  const handleSaveTeam = async (data: Omit<CoachTeam, 'id'>) => {
    try {
      if (editingTeam) {
        await coachTeamRepository.update(editingTeam.id, data);
        toast.success('Passagem atualizada!');
      } else {
        await coachTeamRepository.create(data);
        toast.success('Passagem adicionada!');
      }
      setIsTeamModalOpen(false);
      if (id) loadData(id);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar passagem');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta passagem?')) {
      try {
        await coachTeamRepository.delete(teamId);
        toast.success('Passagem excluída!');
        if (id) loadData(id);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir passagem');
      }
    }
  };

  // --- Handlers para Títulos (CoachTitle) ---
  const handleSaveTitle = async (data: Omit<CoachTitle, 'id'>) => {
    try {
      if (editingTitle) {
        await coachTitleRepository.update(editingTitle.id, data);
        toast.success('Título atualizado!');
      } else {
        await coachTitleRepository.create(data);
        toast.success('Título adicionado!');
      }
      setIsTitleModalOpen(false);
      if (id) loadData(id);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar título');
    }
  };

  const handleDeleteTitle = async (titleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este título?')) {
      try {
        await coachTitleRepository.delete(titleId);
        toast.success('Título excluído!');
        if (id) loadData(id);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir título');
      }
    }
  };

  // --- Handlers para Rebaixamentos (CoachRelegation) ---
  const handleSaveRelegation = async (data: Omit<CoachRelegation, 'id'>) => {
    try {
      if (editingRelegation) {
        await coachRelegationRepository.update(editingRelegation.id, data);
        toast.success('Rebaixamento atualizado!');
      } else {
        await coachRelegationRepository.create(data);
        toast.success('Rebaixamento adicionado!');
      }
      setIsRelegationModalOpen(false);
      if (id) loadData(id);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar rebaixamento');
    }
  };

  const handleDeleteRelegation = async (relegationId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este rebaixamento?')) {
      try {
        await coachRelegationRepository.delete(relegationId);
        toast.success('Rebaixamento excluído!');
        if (id) loadData(id);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir rebaixamento');
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!coach) {
    return <div className="p-8 text-center">Técnico não encontrado.</div>;
  }

  // Agrupar títulos para o Hall de Títulos
  const hallDeTitulos = titulos.reduce((acc, t) => {
    if (!acc[t.competitionId]) acc[t.competitionId] = [];
    acc[t.competitionId].push(t);
    return acc;
  }, {} as Record<string, CoachTitle[]>);

  const passagensClubes = passagens.filter(p => {
    const t = teams.find(t => t.id === p.teamId);
    return t?.tipo !== 'Selecao';
  }).sort((a, b) => a.anoInicio - b.anoInicio);

  const passagensSelecoes = passagens.filter(p => {
    const t = teams.find(t => t.id === p.teamId);
    return t?.tipo === 'Selecao';
  }).sort((a, b) => a.anoInicio - b.anoInicio);

  const hallItems = Object.entries(hallDeTitulos).map(([compId, list]) => {
    const comp = competitions.find(c => c.id === compId);
    return { comp, list };
  }).filter(item => item.comp).sort((a, b) => {
    const compOrder: Record<string, number> = {
      'Seleções': 1,
      'Mundial': 2,
      'Continental': 3,
      'Nacional': 4,
      'Copa': 5,
      'Supercopa': 6
    };
    const orderA = compOrder[a.comp!.tipo] || 99;
    const orderB = compOrder[b.comp!.tipo] || 99;
    return orderA - orderB;
  });

  return (
    <PageContainer>
      <PageHeader 
        title={coach.nome} 
        description={`Detalhes da carreira do técnico ${coach.nacionalidade}`}
        actions={
          <Link 
            to="/coaches"
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        }
      />

      {/* HALL DE TÍTULOS */}
      {hallItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Hall de Títulos
          </h2>
          <div 
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex overflow-x-auto pb-4 gap-4 snap-x sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:pb-0 scrollbar-hide cursor-grab active:cursor-grabbing"
          >
            {hallItems.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => handleCardClick(item as any)}
                className="bg-card border rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all shadow-sm hover:shadow-md shrink-0 w-36 sm:w-auto snap-center select-none"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUNA ESQUERDA: PASSAGENS */}
        <div className="flex flex-col gap-6">
          {/* PASSAGENS (CLUBES) */}
          <AppCard>
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold text-lg">Passagens por Clubes</h3>
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingTeam(undefined);
                  setTeamModalFilter('Clube');
                  setIsTeamModalOpen(true);
                }}
                className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            )}
          </div>
          <AppCardContent className="p-0">
              {passagensClubes.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">Nenhuma passagem registrada.</p>
              ) : (
                <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Clube</th>
                      <th className="px-4 py-3 font-medium text-center">Período</th>
                      <th className="px-4 py-3 font-medium text-center">Jogos</th>
                      <th className="px-4 py-3 font-medium text-center">Aproveitamento</th>
                      {isAdmin && <th className="px-4 py-3 font-medium text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {passagensClubes.map((p) => {
                      const team = teams.find(t => t.id === p.teamId);
                      return (
                        <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium flex items-center gap-2">
                            {team?.escudo ? (
                              <img src={team.escudo} alt={team.nome} className="w-6 h-6 object-contain" />
                            ) : (
                              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-[10px] font-bold">
                                {team?.nome?.substring(0,2).toUpperCase()}
                              </div>
                            )}
                            <Link to={`/teams/${team?.id}`} className="hover:underline">{team?.nome || 'Desconhecido'}</Link>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {p.clubeAtual ? `${p.anoInicio} - Atual` : (p.anoInicio === p.anoFim ? p.anoInicio : `${p.anoInicio} - ${p.anoFim}`)}
                          </td>
                          <td className="px-4 py-3 text-center">{p.jogos}</td>
                          <td className="px-4 py-3 text-center">{p.aproveitamento}%</td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => { setEditingTeam(p); setTeamModalFilter('Clube'); setIsTeamModalOpen(true); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTeam(p.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y">
                {passagensClubes.map((p) => {
                  const team = teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className="p-4 flex flex-col gap-3 bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {team?.escudo ? (
                            <img src={team.escudo} alt={team.nome} className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                              {team?.nome?.substring(0,2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <Link to={`/teams/${team?.id}`} className="font-semibold text-lg text-primary hover:underline block leading-tight">
                              {team?.nome || 'Desconhecido'}
                            </Link>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {p.clubeAtual ? `${p.anoInicio} - Atual` : (p.anoInicio === p.anoFim ? p.anoInicio : `${p.anoInicio} - ${p.anoFim}`)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Jogos</span>
                          <span className="font-medium text-lg">{p.jogos}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-0.5">Aproveitamento</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${p.aproveitamento >= 60 ? 'bg-green-100 text-green-700' : p.aproveitamento >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.aproveitamento}%
                          </span>
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-muted/50 mt-1">
                          <button 
                            onClick={() => { setEditingTeam(p); setTeamModalFilter('Clube'); setIsTeamModalOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteTeam(p.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
                </>
              )}
          </AppCardContent>
          </AppCard>

          {/* PASSAGENS (SELEÇÕES) */}
          <AppCard>
            <div className="p-4 border-b flex justify-between items-center bg-muted/20">
              <h3 className="font-semibold text-lg">Passagens por Seleções</h3>
              {isAdmin && (
                <button 
                  onClick={() => {
                    setEditingTeam(undefined);
                    setTeamModalFilter('Selecao');
                    setIsTeamModalOpen(true);
                  }}
                  className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              )}
            </div>
            <AppCardContent className="p-0">
              {passagensSelecoes.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">Nenhuma passagem registrada.</p>
              ) : (
                <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Seleção</th>
                      <th className="px-4 py-3 font-medium text-center">Período</th>
                      <th className="px-4 py-3 font-medium text-center">Jogos</th>
                      <th className="px-4 py-3 font-medium text-center">Aproveitamento</th>
                      {isAdmin && <th className="px-4 py-3 font-medium text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {passagensSelecoes.map((p) => {
                      const team = teams.find(t => t.id === p.teamId);
                      return (
                        <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium flex items-center gap-2">
                            {team?.escudo ? (
                              <img src={team.escudo} alt={team.nome} className="w-6 h-6 object-contain" />
                            ) : (
                              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-[10px] font-bold">
                                {team?.nome?.substring(0,2).toUpperCase()}
                              </div>
                            )}
                            <Link to={`/national-teams/${team?.id}`} className="hover:underline">{team?.nome || 'Desconhecido'}</Link>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {p.clubeAtual ? `${p.anoInicio} - Atual` : (p.anoInicio === p.anoFim ? p.anoInicio : `${p.anoInicio} - ${p.anoFim}`)}
                          </td>
                          <td className="px-4 py-3 text-center">{p.jogos}</td>
                          <td className="px-4 py-3 text-center">{p.aproveitamento}%</td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => { setEditingTeam(p); setTeamModalFilter('Selecao'); setIsTeamModalOpen(true); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTeam(p.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y">
                {passagensSelecoes.map((p) => {
                  const team = teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className="p-4 flex flex-col gap-3 bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {team?.escudo ? (
                            <img src={team.escudo} alt={team.nome} className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                              {team?.nome?.substring(0,2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <Link to={`/national-teams/${team?.id}`} className="font-semibold text-lg text-primary hover:underline block leading-tight">
                              {team?.nome || 'Desconhecido'}
                            </Link>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {p.clubeAtual ? `${p.anoInicio} - Atual` : (p.anoInicio === p.anoFim ? p.anoInicio : `${p.anoInicio} - ${p.anoFim}`)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Jogos</span>
                          <span className="font-medium text-lg">{p.jogos}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-0.5">Aproveitamento</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${p.aproveitamento >= 60 ? 'bg-green-100 text-green-700' : p.aproveitamento >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.aproveitamento}%
                          </span>
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-muted/50 mt-1">
                          <button 
                            onClick={() => { setEditingTeam(p); setTeamModalFilter('Selecao'); setIsTeamModalOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteTeam(p.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
                </>
              )}
            </AppCardContent>
          </AppCard>
        </div>

        {/* TÍTULOS */}

        <AppCard>
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold text-lg">Títulos Conquistados</h3>
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingTitle(undefined);
                  setIsTitleModalOpen(true);
                }}
                className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            )}
          </div>
          <AppCardContent className="p-0">
            {titulos.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">Nenhum título registrado.</p>
            ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Competição</th>
                      <th className="px-4 py-3 font-medium">Clube</th>
                      <th className="px-4 py-3 font-medium text-center">Temporada</th>
                      {isAdmin && <th className="px-4 py-3 font-medium text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...titulos]
                      .sort((a, b) => {
                        const seasonA = seasons.find(s => s.id === a.seasonId);
                        const seasonB = seasons.find(s => s.id === b.seasonId);
                        return (seasonA?.anoInicio || 0) - (seasonB?.anoInicio || 0);
                      })
                      .map((t) => {
                      const comp = competitions.find(c => c.id === t.competitionId);
                      const team = teams.find(tm => tm.id === t.teamId);
                      const season = seasons.find(s => s.id === t.seasonId);
                      return (
                        <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {comp?.logoTrofeu ? (
                                <img src={comp.logoTrofeu} alt="Troféu" className="w-4 h-4 object-contain" />
                              ) : (
                                <Trophy className="w-4 h-4 text-yellow-500" />
                              )}
                              {comp ? (
                                <Link to={`/competitions/${comp.id}`} className="hover:underline text-primary">
                                  {comp.nome}
                                </Link>
                              ) : (
                                'Desconhecida'
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {team?.escudo ? (
                                <img src={team.escudo} alt={team.nome} className="w-4 h-4 object-contain" />
                              ) : null}
                              {team?.nome || 'Desconhecido'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{season?.anoInicio || '-'}</td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => { setEditingTitle(t); setIsTitleModalOpen(true); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTitle(t.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y">
                {[...titulos]
                  .sort((a, b) => {
                    const seasonA = seasons.find(s => s.id === a.seasonId);
                    const seasonB = seasons.find(s => s.id === b.seasonId);
                    return (seasonA?.anoInicio || 0) - (seasonB?.anoInicio || 0);
                  })
                  .map((t) => {
                  const comp = competitions.find(c => c.id === t.competitionId);
                  const team = teams.find(tm => tm.id === t.teamId);
                  const season = seasons.find(s => s.id === t.seasonId);
                  return (
                    <div key={t.id} className="p-4 flex flex-col gap-3 bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {comp?.logoTrofeu ? (
                            <img src={comp.logoTrofeu} alt="Troféu" className="w-10 h-10 object-contain" />
                          ) : (
                            <Trophy className="w-8 h-8 text-yellow-500" />
                          )}
                          <div>
                            {comp ? (
                              <Link to={`/competitions/${comp.id}`} className="font-semibold text-lg text-primary hover:underline block leading-tight">
                                {comp.nome}
                              </Link>
                            ) : (
                              <span className="font-semibold text-lg leading-tight">Desconhecida</span>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              {team?.escudo ? (
                                <img src={team.escudo} alt={team.nome} className="w-4 h-4 object-contain" />
                              ) : null}
                              <span className="text-sm text-muted-foreground">{team?.nome || 'Desconhecido'}</span>
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-lg text-primary shrink-0 ml-2">{season?.anoInicio || '-'}</span>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-muted/50 mt-1">
                          <button 
                            onClick={() => { setEditingTitle(t); setIsTitleModalOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteTitle(t.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          </AppCardContent>
        </AppCard>

        {/* REBAIXAMENTOS */}
        <AppCard>
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-red-500" />
              Rebaixamentos
            </h3>
            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingRelegation(undefined);
                  setIsRelegationModalOpen(true);
                }}
                className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            )}
          </div>
          <AppCardContent className="p-0">
            {rebaixamentos.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">Nenhum rebaixamento registrado.</p>
            ) : (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Clube</th>
                        <th className="px-4 py-3 font-medium">Competição</th>
                        <th className="px-4 py-3 font-medium text-center">Temporada</th>
                        {isAdmin && <th className="px-4 py-3 font-medium text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[...rebaixamentos]
                        .sort((a, b) => {
                          const seasonA = seasons.find(s => s.id === a.seasonId);
                          const seasonB = seasons.find(s => s.id === b.seasonId);
                          return (seasonA?.anoInicio || 0) - (seasonB?.anoInicio || 0);
                        })
                        .map((r) => {
                          const team = teams.find(tm => tm.id === r.teamId);
                          const season = seasons.find(s => s.id === r.seasonId);
                          return (
                            <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 font-medium">
                                <div className="flex items-center gap-2">
                                  {team?.escudo ? (
                                    <img src={team.escudo} alt={team.nome} className="w-6 h-6 object-contain" />
                                  ) : null}
                                  {team?.nome || 'Desconhecido'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  {r.competition && <span className="block">{r.competition}</span>}
                                  {r.observacoes && <span className="text-xs text-muted-foreground italic block mt-0.5">{r.observacoes}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">{season?.anoInicio || '-'}</td>
                              {isAdmin && (
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => { setEditingRelegation(r); setIsRelegationModalOpen(true); }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Editar"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteRelegation(r.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS */}
                <div className="md:hidden divide-y">
                  {[...rebaixamentos]
                    .sort((a, b) => {
                      const seasonA = seasons.find(s => s.id === a.seasonId);
                      const seasonB = seasons.find(s => s.id === b.seasonId);
                      return (seasonA?.anoInicio || 0) - (seasonB?.anoInicio || 0);
                    })
                    .map((r) => {
                      const team = teams.find(tm => tm.id === r.teamId);
                      const season = seasons.find(s => s.id === r.seasonId);
                      return (
                        <div key={r.id} className="p-4 flex flex-col gap-3 hover:bg-muted/30 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              {team?.escudo ? (
                                <img src={team.escudo} alt={team.nome} className="w-10 h-10 object-contain" />
                              ) : null}
                              <div>
                                <p className="font-semibold text-lg leading-tight">{team?.nome || 'Desconhecido'}</p>
                                {r.competition && (
                                  <p className="text-sm text-muted-foreground">{r.competition}</p>
                                )}
                                {r.observacoes && (
                                  <p className="text-xs text-muted-foreground italic mt-1">{r.observacoes}</p>
                                )}
                              </div>
                            </div>
                            <span className="font-bold text-lg text-foreground shrink-0">{season?.anoInicio || '-'}</span>
                          </div>
                          {isAdmin && (
                            <div className="flex justify-end gap-2 pt-2 border-t border-muted/50 mt-1">
                              <button 
                                onClick={() => { setEditingRelegation(r); setIsRelegationModalOpen(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              >
                                <Edit className="w-4 h-4" /> Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteRelegation(r.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </AppCardContent>
        </AppCard>

      </div>

      {/* MODAL HALL DE TÍTULOS DETALHES */}
      {hallModalData && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-xl shadow-2xl border-t sm:border overflow-hidden max-h-[85vh] sm:max-h-[80vh] flex flex-col relative animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            
            {/* Mobile handle */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 left-0 z-10">
              <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
            </div>

            <div className="px-5 pt-8 pb-5 sm:p-6 sm:pt-6 border-b flex justify-between items-start sm:items-center bg-muted/10 shrink-0 relative">
              <div className="flex items-center gap-4 flex-1">
                {hallModalData.comp.logoTrofeu ? (
                  <img src={hallModalData.comp.logoTrofeu} alt="Troféu" className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md" />
                ) : (
                  <Trophy className="w-10 h-10 text-yellow-500 drop-shadow-md" />
                )}
                <div className="flex-1 pr-2">
                  <h2 className="text-lg sm:text-xl font-bold leading-tight text-foreground">{hallModalData.comp.nome}</h2>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{hallModalData.titles.length} conquista(s)</p>
                </div>
              </div>
              <button 
                onClick={() => setHallModalData(null)}
                className="p-2 -mr-2 sm:mr-0 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground shrink-0"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1 pb-6 sm:pb-0">
              <div className="divide-y divide-border/50">
                {hallModalData.titles.map((t, idx) => {
                  const team = teams.find(tm => tm.id === t.teamId);
                  const season = seasons.find(s => s.id === t.seasonId);
                  return (
                    <div key={idx} className="px-5 py-4 sm:p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        {team?.escudo ? (
                          <img src={team.escudo} alt={team.nome} className="w-10 h-10 sm:w-9 sm:h-9 object-contain drop-shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 sm:w-9 sm:h-9 bg-muted rounded-full flex items-center justify-center text-xs font-bold border shadow-sm">
                            {team?.nome?.substring(0,2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-base sm:text-sm text-foreground leading-tight">{team?.nome}</p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">Temporada {season?.descricao}</p>
                        </div>
                      </div>
                      <div className="font-bold text-xl sm:text-lg text-primary ml-4 shrink-0">
                        {season?.anoInicio}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PASSAGEM */}
      <Modal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        title={editingTeam ? 'Editar Passagem' : 'Nova Passagem'}
      >
        <CoachTeamForm
          coachId={id || ''}
          teams={teams}
          initialData={editingTeam}
          filter={teamModalFilter}
          onSubmit={handleSaveTeam}
          onCancel={() => setIsTeamModalOpen(false)}
        />
      </Modal>

      {/* MODAL TÍTULO */}
      <Modal
        isOpen={isTitleModalOpen}
        onClose={() => setIsTitleModalOpen(false)}
        title={editingTitle ? 'Editar Título' : 'Novo Título'}
      >
        <CoachTitleForm
          coachId={id || ''}
          teams={teams}
          competitions={competitions}
          seasons={seasons}
          passagens={passagens}
          initialData={editingTitle}
          onSubmit={handleSaveTitle}
          onCancel={() => setIsTitleModalOpen(false)}
        />
      </Modal>

      {/* MODAL REBAIXAMENTO */}
      <Modal
        isOpen={isRelegationModalOpen}
        onClose={() => setIsRelegationModalOpen(false)}
        title={editingRelegation ? 'Editar Rebaixamento' : 'Novo Rebaixamento'}
      >
        <CoachRelegationForm
          coachId={id || ''}
          teams={teams}
          seasons={seasons}
          passagens={passagens}
          initialData={editingRelegation}
          onSubmit={handleSaveRelegation}
          onCancel={() => setIsRelegationModalOpen(false)}
        />
      </Modal>

    </PageContainer>
  );
}
