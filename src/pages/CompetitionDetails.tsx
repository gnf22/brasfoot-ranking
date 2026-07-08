import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageContainer } from '../components/common/PageContainer';
import { AppCard, AppCardContent } from '../components/common/AppCard';
import { 
  competitionRepository,
  coachTitleRepository,
  teamTitleRepository,
  teamRepository,
  coachRepository,
  seasonRepository
} from '../repositories';
import type { Competition, CoachTitle, TeamTitle, Team, Coach, Season } from '../models';

export function CompetitionDetails() {
  const { id } = useParams<{ id: string }>();
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [history, setHistory] = useState<{ title: CoachTitle | TeamTitle; coach?: Coach; team: Team; season: Season }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (compId: string) => {
    setIsLoading(true);
    try {
      const comp = await competitionRepository.getById(compId);
      if (!comp) {
        toast.error('Competição não encontrada');
        setIsLoading(false);
        return;
      }
      setCompetition(comp);

      const [allCoachTitles, allTeamTitles, allCoaches, allTeams, allSeasons] = await Promise.all([
        coachTitleRepository.getAll(),
        teamTitleRepository.getAll(),
        coachRepository.getAll(),
        teamRepository.getAll(),
        seasonRepository.getAll()
      ]);

      const compCoachTitles = allCoachTitles.filter(t => t.competitionId === compId);
      const compTeamTitles = allTeamTitles.filter(t => t.competitionId === compId);

      const historyData: { title: CoachTitle | TeamTitle; coach?: Coach; team: Team; season: Season }[] = [];

      compCoachTitles.forEach(t => {
        const coach = allCoaches.find(c => c.id === t.coachId);
        const team = allTeams.find(tm => tm.id === t.teamId);
        const season = allSeasons.find(s => s.id === t.seasonId);
        
        if (coach && team && season) {
          historyData.push({ title: t, coach, team, season });
        }
      });

      compTeamTitles.forEach(t => {
        const team = allTeams.find(tm => tm.id === t.teamId);
        const season = allSeasons.find(s => s.id === t.seasonId);
        
        if (team && season) {
          historyData.push({ title: t, team, season });
        }
      });

      // Ordenar por ano descrecente
      historyData.sort((a, b) => b.season.anoInicio - a.season.anoInicio);

      setHistory(historyData);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados da competição');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!competition) {
    return <div className="p-8 text-center">Competição não encontrada.</div>;
  }

  // Resumo estatístico
  const clubTitlesCount = history.reduce((acc, curr) => {
    acc[curr.team.id] = (acc[curr.team.id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const coachTitlesCount = history.reduce((acc, curr) => {
    if (curr.coach) {
      acc[curr.coach.id] = (acc[curr.coach.id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topClubId = Object.entries(clubTitlesCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topCoachId = Object.entries(coachTitlesCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  const topClub = topClubId ? history.find(h => h.team.id === topClubId)?.team : null;
  const topCoach = topCoachId ? history.find(h => h.coach?.id === topCoachId)?.coach : null;

  return (
    <PageContainer>
      <div className="rounded-xl overflow-hidden mb-6 shadow-sm border bg-card">
        <div className="p-8 flex items-center gap-6 bg-gradient-to-r from-muted/50 to-background">
          <div className="w-24 h-24 flex-shrink-0 bg-white rounded-full flex items-center justify-center p-2 shadow-sm border">
            {competition.logoTrofeu ? (
              <img src={competition.logoTrofeu} alt="Troféu" className="w-16 h-16 object-contain" />
            ) : (
              <Trophy className="w-12 h-12 text-yellow-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-wider">
                {competition.tipo}
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {competition.pais}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{competition.nome}</h1>
            <div className="mt-4">
              <Link 
                to="/competitions"
                className="inline-flex items-center gap-2 px-4 py-2 bg-background border hover:bg-muted rounded-md transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para Competições
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <AppCard>
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold text-lg flex items-center gap-2">Histórico de Campeões</h3>
            </div>
            <AppCardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum título registrado para esta competição.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-6 py-4 font-medium text-center w-24">Ano</th>
                        <th className="px-6 py-4 font-medium">Clube Campeão</th>
                        <th className="px-6 py-4 font-medium">Técnico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.map((h, idx) => (
                        <tr key={idx} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 text-center font-bold text-primary">
                            <Link to={`/seasons/${h.season.id}`} className="hover:underline">
                              {h.season.anoInicio}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {h.team.escudo ? (
                                <img src={h.team.escudo} alt={h.team.nome} className="w-6 h-6 object-contain" />
                              ) : (
                                <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-[10px] font-bold">
                                  {h.team.nome.substring(0,2).toUpperCase()}
                                </div>
                              )}
                              <Link to={`/teams/${h.team.id}`} className="font-semibold hover:underline">
                                {h.team.nome}
                              </Link>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {h.coach ? (
                              <Link to={`/coaches/${h.coach.id}`} className="hover:underline text-muted-foreground">
                                {h.coach.nome}
                              </Link>
                            ) : (
                              <span className="italic text-muted-foreground">Conquistado pela IA</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AppCardContent>
          </AppCard>
        </div>

        <div className="space-y-6">
          <AppCard>
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold text-lg flex items-center gap-2">Resumo Estatístico</h3>
            </div>
            <AppCardContent className="p-6 space-y-6">
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Total de Edições Registradas</h4>
                <p className="text-3xl font-bold">{history.length}</p>
              </div>

              {topClub && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Maior Clube Campeão</h4>
                  <div className="flex items-center gap-4">
                    {topClub.escudo ? (
                      <img src={topClub.escudo} alt={topClub.nome} className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-lg font-bold">
                        {topClub.nome.substring(0,2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <Link to={`/teams/${topClub.id}`} className="font-bold hover:underline">
                        {topClub.nome}
                      </Link>
                      <p className="text-sm text-primary font-medium">{clubTitlesCount[topClub.id]} título(s)</p>
                    </div>
                  </div>
                </div>
              )}

              {topCoach && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Técnico mais Vitorioso</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <Link to={`/coaches/${topCoach.id}`} className="font-bold hover:underline">
                        {topCoach.nome}
                      </Link>
                      <p className="text-sm text-primary font-medium">{coachTitlesCount[topCoach.id]} título(s)</p>
                    </div>
                  </div>
                </div>
              )}

            </AppCardContent>
          </AppCard>
        </div>

      </div>
    </PageContainer>
  );
}
