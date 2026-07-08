import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { 
  coachRepository, 
  teamRepository, 
  competitionRepository, 
  seasonRepository,
  coachTitleRepository,
  rankingCoachRepository
} from '../repositories';
import type { Coach, RankingCoach } from '../models';
import { AppCard, AppCardContent } from '../components/common/AppCard';

export function Dashboard() {
  const [stats, setStats] = useState({
    coaches: 0,
    teams: 0,
    titles: 0,
    competitions: 0,
    seasons: 0
  });

  const [topRanking, setTopRanking] = useState<(RankingCoach & { coach?: Coach })[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, t, tit, comp, s, rankingData] = await Promise.all([
          coachRepository.getAll(),
          teamRepository.getAll(),
          coachTitleRepository.getAll(),
          competitionRepository.getAll(),
          seasonRepository.getAll(),
          rankingCoachRepository.getAll()
        ]);
        
        setStats({
          coaches: c.length,
          teams: t.length,
          titles: tit.length,
          competitions: comp.length,
          seasons: s.length
        });

        const merged = rankingData.map(r => ({
          ...r,
          coach: c.find((coach: Coach) => coach.id === r.coachId)
        }));

        merged.sort((a, b) => b.totalPontos - a.totalPontos);
        setTopRanking(merged.slice(0, 5)); // Top 5
      } catch (e) {
        console.error('Error loading dashboard stats:', e);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do sistema de ranking.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Técnicos', value: stats.coaches },
          { label: 'Clubes', value: stats.teams },
          { label: 'Títulos', value: stats.titles },
          { label: 'Competições', value: stats.competitions },
          { label: 'Temporadas', value: stats.seasons }
        ].map(stat => (
          <div key={stat.label} className="p-6 border rounded-xl bg-card shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top 5 Técnicos
        </h3>
        <AppCard>
          <AppCardContent className="p-0">
            {topRanking.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <p>Nenhum dado no ranking. Vá para a página de Ranking e clique em Recalcular.</p>
                <Link to="/ranking" className="text-primary hover:underline mt-2 inline-block">Ir para Ranking</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-medium text-center">Pos</th>
                      <th className="px-6 py-4 font-medium">Técnico</th>
                      <th className="px-6 py-4 font-medium text-center">Pontos</th>
                      <th className="px-6 py-4 font-medium text-center">Títulos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topRanking.map((row, index) => (
                      <tr key={row.coachId} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-center text-lg text-primary">
                          {index + 1}º
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Link to={`/coaches/${row.coachId}`} className="block hover:opacity-80 transition-opacity">
                              <p className="font-semibold text-primary hover:underline">{row.coach?.nome || 'Desconhecido'}</p>
                              <p className="text-xs text-muted-foreground">{row.coach?.nacionalidade}</p>
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-lg">{row.totalPontos}</td>
                        <td className="px-6 py-4 text-center">{row.totalTitulos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AppCardContent>
        </AppCard>
      </div>
    </div>
  );
}
