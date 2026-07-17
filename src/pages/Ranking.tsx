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
                <thead className="text-[11px] uppercase bg-muted/50 border-b tracking-wider">
                  <tr>
                    <th className="px-3 py-2 font-medium text-center w-10">Pos</th>
                    <th className="px-3 py-2 font-medium">Técnico</th>
                    <th className="px-3 py-2 font-medium text-center">Pontos</th>
                    <th className="px-3 py-2 font-medium text-center">Títulos</th>
                    <th className="px-3 py-2 font-medium text-center">Jogos</th>
                    <th className="px-3 py-2 font-medium text-center">% Aprov.</th>
                    <th className="px-3 py-2 font-medium text-center">V-E-D</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ranking.map((row, index) => (
                    <tr key={row.coachId} className="hover:bg-muted/50 transition-colors group">
                      <td className="px-3 py-2 font-bold text-center text-muted-foreground group-hover:text-foreground">
                        {index + 1}º
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {index < 3 && <Trophy className={`w-4 h-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`} />}
                          <Link to={`/coaches/${row.coachId}`} className="block hover:opacity-80 transition-opacity leading-tight">
                            <p className="font-semibold text-primary hover:underline">{row.coach?.nome || 'Desconhecido'}</p>
                            <p className="text-[11px] text-muted-foreground">{row.coach?.nacionalidade}</p>
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-primary">{row.totalPontos}</td>
                      <td className="px-3 py-2 text-center font-medium">{row.totalTitulos}</td>
                      <td className="px-3 py-2 text-center font-medium">{row.totalJogos}</td>
                      <td className="px-3 py-2 text-center font-medium">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${row.aproveitamento >= 60 ? 'bg-green-100 text-green-700' : row.aproveitamento >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {row.aproveitamento}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                        <span className="text-green-600">{row.totalVitorias}</span> - 
                        <span className="text-yellow-600"> {row.totalEmpates}</span> - 
                        <span className="text-red-600"> {row.totalDerrotas}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y">
                {ranking.map((row, index) => (
                  <div key={row.coachId} className="p-3 flex flex-col gap-2 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold justify-center text-sm relative">
                        {index + 1}º
                        {index < 3 && <Trophy className={`w-3.5 h-3.5 absolute -bottom-1 -right-1 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <Link to={`/coaches/${row.coachId}`} className="font-semibold text-base text-primary hover:underline block leading-tight truncate">
                            {row.coach?.nome || 'Desconhecido'}
                          </Link>
                          <span className="font-bold text-base text-primary whitespace-nowrap">{row.totalPontos} pt</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{row.coach?.nacionalidade}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs pl-11">
                      <div className="text-muted-foreground flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-500" /> <strong className="text-foreground">{row.totalTitulos}</strong></span>
                        <span className="text-muted-foreground/30">|</span>
                        <span><strong className="text-foreground">{row.totalJogos}</strong> J</span>
                        <span className="text-muted-foreground/30">|</span>
                        <span>
                          <strong className="text-green-600">{row.totalVitorias}</strong>-
                          <strong className="text-yellow-600">{row.totalEmpates}</strong>-
                          <strong className="text-red-600">{row.totalDerrotas}</strong>
                        </span>
                        <span className={`text-[10px] ml-1 font-semibold px-1.5 py-0.5 rounded-md ${row.aproveitamento >= 60 ? 'bg-green-100 text-green-700' : row.aproveitamento >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {row.aproveitamento}%
                        </span>
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
