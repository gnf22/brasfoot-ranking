import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Shield, Calendar, Medal, TrendingDown, CheckCircle, Target, Flag, Globe } from 'lucide-react';
import { 
  coachRepository, 
  teamRepository, 
  competitionRepository, 
  seasonRepository,
  rankingCoachRepository,
  coachRelegationRepository,
  coachTeamRepository,
  coachTitleRepository
} from '../repositories';
import type { Coach, RankingCoach, Team } from '../models';
import { AppCard, AppCardContent } from '../components/common/AppCard';

export function Dashboard() {
  const [stats, setStats] = useState({
    coaches: 0,
    teams: 0,
    titles: 0,
    competitions: 0,
    seasons: 0
  });

  const [topTitulos, setTopTitulos] = useState<(RankingCoach & { coach?: Coach })[]>([]);
  const [topJogos, setTopJogos] = useState<(RankingCoach & { coach?: Coach })[]>([]);
  const [topAproveitamento, setTopAproveitamento] = useState<(RankingCoach & { coach?: Coach })[]>([]);
  const [topRebaixamentos, setTopRebaixamentos] = useState<{ coachId: string, count: number, coach?: Coach }[]>([]);

  // Novos estados
  const [topJogosClube, setTopJogosClube] = useState<{ coach?: Coach, team?: Team, jogos: number }[]>([]);
  const [topTitulosNacionais, setTopTitulosNacionais] = useState<{ coachId: string, count: number, coach?: Coach }[]>([]);
  const [topTitulosInternacionais, setTopTitulosInternacionais] = useState<{ coachId: string, count: number, coach?: Coach }[]>([]);
  const [topTitulosSelecao, setTopTitulosSelecao] = useState<{ coachId: string, count: number, coach?: Coach }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, t, competitions, s, rankingData, relegationsData, coachTeams, coachTitles] = await Promise.all([
          coachRepository.getAll(),
          teamRepository.getAll(),
          competitionRepository.getAll(),
          seasonRepository.getAll(),
          rankingCoachRepository.getAll(),
          coachRelegationRepository.getAll(),
          coachTeamRepository.getAll(),
          coachTitleRepository.getAll()
        ]);
        
        const mergedRanking = rankingData.map(r => ({
          ...r,
          coach: c.find((coach: Coach) => coach.id === r.coachId)
        }));

        const totalTitles = rankingData.reduce((acc, r) => acc + r.totalTitulos, 0);

        setStats({
          coaches: c.length,
          teams: t.length,
          titles: totalTitles,
          competitions: competitions.length,
          seasons: s.length
        });

        // 1. Mais Títulos
        const byTitulos = [...mergedRanking].sort((a, b) => b.totalTitulos - a.totalTitulos).slice(0, 5);
        setTopTitulos(byTitulos);

        // 2. Mais Jogos
        const byJogos = [...mergedRanking].sort((a, b) => b.totalJogos - a.totalJogos).slice(0, 5);
        setTopJogos(byJogos);

        // 3. Melhor Aproveitamento (Mínimo de 10 jogos)
        const byAproveitamento = [...mergedRanking]
          .filter(r => r.totalJogos >= 10)
          .sort((a, b) => b.aproveitamento - a.aproveitamento)
          .slice(0, 5);
        setTopAproveitamento(byAproveitamento);

        // 4. Mais Rebaixamentos
        const relCount = relegationsData.reduce((acc, rel) => {
          acc[rel.coachId] = (acc[rel.coachId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const relList = Object.entries(relCount)
          .map(([coachId, count]) => ({
            coachId,
            count,
            coach: c.find((coach: Coach) => coach.id === coachId)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopRebaixamentos(relList);

        // 5. Técnicos com mais jogos pelo mesmo clube
        const jogosPorClube = coachTeams
          .filter(ct => {
            const team = t.find((team: Team) => team.id === ct.teamId);
            return team && team.tipo !== 'Selecao';
          })
          .map(ct => {
            let computedJogos = Number(ct.jogos) || 0;
            if (computedJogos === 0 && Array.isArray(ct.estatisticasPorAno)) {
              computedJogos = ct.estatisticasPorAno.reduce((sum, ano) => sum + (Number(ano?.jogos) || 0), 0);
            }
            return {
              coach: c.find(coach => coach && coach.id === ct.coachId),
              team: t.find(team => team && team.id === ct.teamId),
              jogos: computedJogos
            };
          })
          .sort((a, b) => b.jogos - a.jogos)
          .slice(0, 5);
        setTopJogosClube(jogosPorClube);

        // 6. Técnicos com mais títulos nacionais (Brasileirão, Copa do Brasil e Supercopa do Brasil)
        const nomesNacionais = ['brasileirão', 'campeonato brasileiro', 'copa do brasil', 'supercopa do brasil'];
        const isNacional = (compName: string) => nomesNacionais.some(n => compName.toLowerCase().includes(n));
        
        const countNacionais = coachTitles.reduce((acc, title) => {
          const competition = competitions.find(comp => comp.id === title.competitionId);
          if (competition && isNacional(competition.nome)) {
            acc[title.coachId] = (acc[title.coachId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const topNacionais = Object.entries(countNacionais)
          .map(([coachId, count]) => ({
            coachId,
            count,
            coach: c.find(coach => coach.id === coachId)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopTitulosNacionais(topNacionais);

        // 7. Técnicos com mais títulos internacionais
        const nomesInternacionais = ['libertadores', 'sul-americana', 'intercontinental', 'mundo de clubes', 'mundial de clubes', 'recopa sul-americana'];
        const isInternacional = (compName: string) => nomesInternacionais.some(n => compName.toLowerCase().includes(n));
        
        const countInternacionais = coachTitles.reduce((acc, title) => {
          const competition = competitions.find(comp => comp.id === title.competitionId);
          if (competition && isInternacional(competition.nome)) {
            acc[title.coachId] = (acc[title.coachId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const topInternacionais = Object.entries(countInternacionais)
          .map(([coachId, count]) => ({
            coachId,
            count,
            coach: c.find(coach => coach.id === coachId)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopTitulosInternacionais(topInternacionais);

        // 8. Técnicos com mais títulos por seleção
        const countSelecao = coachTitles.reduce((acc, title) => {
          const team = t.find(team => team.id === title.teamId);
          if (team && team.tipo === 'Selecao') {
            acc[title.coachId] = (acc[title.coachId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const topSelecao = Object.entries(countSelecao)
          .map(([coachId, count]) => ({
            coachId,
            count,
            coach: c.find(coach => coach.id === coachId)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopTitulosSelecao(topSelecao);

      } catch (e) {
        console.error('Error loading dashboard stats:', e);
      }
    }
    loadData();
  }, []);

  const statCards = [
    { label: 'Técnicos', value: stats.coaches, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Clubes/Sel.', value: stats.teams, icon: Shield, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Títulos', value: stats.titles, icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Competições', value: stats.competitions, icon: Medal, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Temporadas', value: stats.seasons, icon: Calendar, color: 'text-red-500', bg: 'bg-red-500/10' }
  ];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Visão geral interativa do sistema de estatísticas.</p>
      </div>
      
      {/* STAT CARDS */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-5 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold relative z-10">{stat.value}</p>
              
              <Icon className={`w-24 h-24 absolute -bottom-6 -right-6 ${stat.color} opacity-[0.03] group-hover:scale-110 transition-transform duration-500`} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MAIS TÍTULOS */}
        <AppCard>
          <div className="p-5 border-b bg-card flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div>
              <h3 className="text-lg font-bold tracking-tight">Mais Títulos</h3>
              <p className="text-xs text-muted-foreground">Técnicos mais vencedores</p>
            </div>
          </div>
          <AppCardContent className="p-0">
            <div className="divide-y">
              {topTitulos.map((row, i) => (
                <div key={row.coachId} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-4 text-center">{i + 1}º</span>
                    <Link to={`/coaches/${row.coachId}`} className="font-semibold text-primary hover:underline">
                      {row.coach?.nome}
                    </Link>
                  </div>
                  <span className="font-bold text-lg bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">{row.totalTitulos}</span>
                </div>
              ))}
              {topTitulos.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Sem dados suficientes.</div>}
            </div>
          </AppCardContent>
        </AppCard>

        {/* MELHOR APROVEITAMENTO */}
        <AppCard>
          <div className="p-5 border-b bg-card flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="text-lg font-bold tracking-tight">Melhor Aproveitamento</h3>
              <p className="text-xs text-muted-foreground">Técnicos mais eficientes (Min 10 jogos)</p>
            </div>
          </div>
          <AppCardContent className="p-0">
            <div className="divide-y">
              {topAproveitamento.map((row, i) => (
                <div key={row.coachId} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-4 text-center">{i + 1}º</span>
                    <Link to={`/coaches/${row.coachId}`} className="font-semibold text-primary hover:underline">
                      {row.coach?.nome}
                    </Link>
                  </div>
                  <span className="font-bold text-lg bg-green-100 text-green-700 px-3 py-1 rounded-full">{row.aproveitamento}%</span>
                </div>
              ))}
              {topAproveitamento.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Sem dados suficientes.</div>}
            </div>
          </AppCardContent>
        </AppCard>

        {/* MAIS JOGOS */}
        <AppCard>
          <div className="p-5 border-b bg-card flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-lg font-bold tracking-tight">Mais Jogos</h3>
              <p className="text-xs text-muted-foreground">Técnicos com mais partidas</p>
            </div>
          </div>
          <AppCardContent className="p-0">
            <div className="divide-y">
              {topJogos.map((row, i) => (
                <div key={row.coachId} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-4 text-center">{i + 1}º</span>
                    <Link to={`/coaches/${row.coachId}`} className="font-semibold text-primary hover:underline">
                      {row.coach?.nome}
                    </Link>
                  </div>
                  <span className="font-bold text-lg bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{row.totalJogos}</span>
                </div>
              ))}
              {topJogos.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Sem dados suficientes.</div>}
            </div>
          </AppCardContent>
        </AppCard>

        {/* MAIS REBAIXAMENTOS */}
        <AppCard>
          <div className="p-5 border-b bg-card flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-lg font-bold tracking-tight">Mais Rebaixamentos</h3>
              <p className="text-xs text-muted-foreground">Técnicos com mais quedas</p>
            </div>
          </div>
          <AppCardContent className="p-0">
            <div className="divide-y">
              {topRebaixamentos.map((row, i) => (
                <div key={row.coachId} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-4 text-center">{i + 1}º</span>
                    <Link to={`/coaches/${row.coachId}`} className="font-semibold text-primary hover:underline">
                      {row.coach?.nome}
                    </Link>
                  </div>
                  <span className="font-bold text-lg bg-red-100 text-red-700 px-3 py-1 rounded-full">{row.count}</span>
                </div>
              ))}
              {topRebaixamentos.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Sem dados suficientes.</div>}
            </div>
          </AppCardContent>
        </AppCard>

        {/* JOGOS PELO MESMO CLUBE */}
        <AppCard>
          <div className="p-5 border-b bg-card flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-lg font-bold tracking-tight">Mais Jogos pelo Mesmo Clube</h3>
              <p className="text-xs text-muted-foreground">Top 5 técnicos com mais partidas em um único time</p>
            </div>
          </div>
          <AppCardContent className="p-0">
            <div className="divide-y">
              {topJogosClube.map((row, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-4 text-center">{i + 1}º</span>
                    <div className="flex flex-col">
                      <Link to={`/coaches/${row.coach?.id}`} className="font-semibold text-primary hover:underline leading-tight">
                        {row.coach?.nome}
                      </Link>
                      <span className="text-xs text-muted-foreground">{row.team?.nome}</span>
                    </div>
                  </div>
                  <span className="font-bold text-lg bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">{row.jogos}</span>
                </div>
              ))}
              {topJogosClube.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Sem dados suficientes.</div>}
            </div>
          </AppCardContent>
        </AppCard>

        {/* TÍTULOS NACIONAIS */}
        <AppCard>
          <div className="p-5 border-b bg-card flex items-center gap-2">
            <Medal className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-lg font-bold tracking-tight">Mais Títulos Nacionais</h3>
              <p className="text-xs text-muted-foreground">Brasileirão, Copa do Brasil e Supercopa</p>
            </div>
          </div>
          <AppCardContent className="p-0">
            <div className="divide-y">
              {topTitulosNacionais.map((row, i) => (
                <div key={row.coachId} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-4 text-center">{i + 1}º</span>
                    <Link to={`/coaches/${row.coachId}`} className="font-semibold text-primary hover:underline">
                      {row.coach?.nome}
                    </Link>
                  </div>
                  <span className="font-bold text-lg bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">{row.count}</span>
                </div>
              ))}
              {topTitulosNacionais.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Sem dados suficientes.</div>}
            </div>
          </AppCardContent>
        </AppCard>

        {/* TÍTULOS INTERNACIONAIS */}
        <AppCard>
          <div className="p-5 border-b bg-card flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-500" />
            <div>
              <h3 className="text-lg font-bold tracking-tight">Mais Títulos Internacionais</h3>
              <p className="text-xs text-muted-foreground">Libertadores, Sula, Mundial, Recopa</p>
            </div>
          </div>
          <AppCardContent className="p-0">
            <div className="divide-y">
              {topTitulosInternacionais.map((row, i) => (
                <div key={row.coachId} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-4 text-center">{i + 1}º</span>
                    <Link to={`/coaches/${row.coachId}`} className="font-semibold text-primary hover:underline">
                      {row.coach?.nome}
                    </Link>
                  </div>
                  <span className="font-bold text-lg bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full">{row.count}</span>
                </div>
              ))}
              {topTitulosInternacionais.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Sem dados suficientes.</div>}
            </div>
          </AppCardContent>
        </AppCard>

        {/* TÍTULOS POR SELEÇÃO */}
        <AppCard>
          <div className="p-5 border-b bg-card flex items-center gap-2">
            <Flag className="w-5 h-5 text-fuchsia-500" />
            <div>
              <h3 className="text-lg font-bold tracking-tight">Mais Títulos por Seleção</h3>
              <p className="text-xs text-muted-foreground">Troféus conquistados com seleções</p>
            </div>
          </div>
          <AppCardContent className="p-0">
            <div className="divide-y">
              {topTitulosSelecao.map((row, i) => (
                <div key={row.coachId} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-4 text-center">{i + 1}º</span>
                    <Link to={`/coaches/${row.coachId}`} className="font-semibold text-primary hover:underline">
                      {row.coach?.nome}
                    </Link>
                  </div>
                  <span className="font-bold text-lg bg-fuchsia-100 text-fuchsia-800 px-3 py-1 rounded-full">{row.count}</span>
                </div>
              ))}
              {topTitulosSelecao.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Sem dados suficientes.</div>}
            </div>
          </AppCardContent>
        </AppCard>

      </div>
    </div>
  );
}
