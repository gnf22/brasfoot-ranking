import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Trophy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageContainer, PageHeader } from '../components/common/PageContainer';
import { AppCard, AppCardContent } from '../components/common/AppCard';
import { rankingCoachRepository, coachRepository } from '../repositories';
import { rankingService } from '../services/RankingService';
import type { RankingCoach, Coach } from '../models';
import { useAuth } from '../contexts/AuthContext';

export function Ranking() {
  const { isAdmin } = useAuth();
  const [ranking, setRanking] = useState<(RankingCoach & { coach?: Coach })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    setIsLoading(true);
    try {
      const rankingData = await rankingCoachRepository.getAll();
      const coaches = await coachRepository.getAll();

      // Merge coach info
      const merged = rankingData.map(r => ({
        ...r,
        coach: coaches.find((c: Coach) => c.id === r.coachId)
      }));

      // Sort just in case firestore didn't sort perfectly
      merged.sort((a, b) => b.totalPontos - a.totalPontos);
      
      setRanking(merged);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar o ranking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!window.confirm('Recalcular o ranking pode levar alguns segundos. Deseja continuar?')) {
      return;
    }
    
    setIsRecalculating(true);
    try {
      await rankingService.recalculateAll();
      toast.success('Ranking recalculado com sucesso!');
      await loadRanking();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao recalcular o ranking');
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Ranking Geral" 
        description="Classificação atualizada dos melhores técnicos de futebol."
        actions={
          isAdmin ? (
            <button 
              onClick={handleRecalculate}
              disabled={isRecalculating || isLoading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Recalculando...' : 'Recalcular Ranking'}
            </button>
          ) : null
        }
      />

      <AppCard>
        <AppCardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Carregando ranking...</p>
            </div>
          ) : ranking.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum dado no ranking. Clique em Recalcular para gerar a pontuação.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium text-center">Pos</th>
                    <th className="px-6 py-4 font-medium">Técnico</th>
                    <th className="px-6 py-4 font-medium text-center">Pontos</th>
                    <th className="px-6 py-4 font-medium text-center">Títulos</th>
                    <th className="px-6 py-4 font-medium text-center">Jogos</th>
                    <th className="px-6 py-4 font-medium text-center">% Aprov.</th>
                    <th className="px-6 py-4 font-medium text-center">V-E-D</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ranking.map((row, index) => (
                    <tr key={row.coachId} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-center text-lg text-primary">
                        {index + 1}º
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {index < 3 && <Trophy className={`w-5 h-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`} />}
                          <Link to={`/coaches/${row.coachId}`} className="block hover:opacity-80 transition-opacity">
                            <p className="font-semibold text-primary hover:underline">{row.coach?.nome || 'Desconhecido'}</p>
                            <p className="text-xs text-muted-foreground">{row.coach?.nacionalidade}</p>
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-lg">{row.totalPontos}</td>
                      <td className="px-6 py-4 text-center">{row.totalTitulos}</td>
                      <td className="px-6 py-4 text-center">{row.totalJogos}</td>
                      <td className="px-6 py-4 text-center font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${row.aproveitamento >= 60 ? 'bg-green-100 text-green-700' : row.aproveitamento >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {row.aproveitamento}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-muted-foreground">
                        {row.totalVitorias} - {row.totalEmpates} - {row.totalDerrotas}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y">
                {ranking.map((row, index) => (
                  <div key={row.coachId} className="p-4 flex gap-4 bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col items-center min-w-[3rem]">
                      <span className="font-bold text-2xl text-primary">{index + 1}º</span>
                      {index < 3 && <Trophy className={`w-5 h-5 mt-1 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link to={`/coaches/${row.coachId}`} className="block hover:opacity-80 transition-opacity mb-1">
                        <p className="font-semibold text-primary hover:underline text-lg leading-tight truncate">{row.coach?.nome || 'Desconhecido'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{row.coach?.nacionalidade}</p>
                      </Link>
                      
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-4">
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-0.5">Pontos</span>
                          <span className="font-bold text-xl">{row.totalPontos}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-0.5">Títulos</span>
                          <span className="font-semibold text-lg">{row.totalTitulos}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-0.5">Aprov. (%)</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${row.aproveitamento >= 60 ? 'bg-green-100 text-green-700' : row.aproveitamento >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {row.aproveitamento}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider block mb-0.5">V-E-D / Jogos</span>
                          <span className="text-sm font-medium">
                            <span className="text-green-600">{row.totalVitorias}</span> - 
                            <span className="text-yellow-600"> {row.totalEmpates}</span> - 
                            <span className="text-red-600"> {row.totalDerrotas}</span>
                            <span className="text-muted-foreground text-xs ml-1">({row.totalJogos})</span>
                          </span>
                        </div>
                      </div>
                    </div>
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
