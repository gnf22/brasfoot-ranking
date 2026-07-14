import {
  coachRepository,
  coachTitleRepository,
  competitionWeightRepository,
  competitionRepository,
  coachTeamRepository,
  rankingCoachRepository
} from '../repositories';
import type {  RankingCoach, CoachTitle, CoachTeam  } from '../models';

export class RankingService {
  /**
   * Recalcula o ranking de todos os técnicos
   */
  async recalculateAll(): Promise<void> {
    const coaches = await coachRepository.getAll();
    const weights = await competitionWeightRepository.getAll();
    const competitions = await competitionRepository.getAll();
    const titles = await coachTitleRepository.getAll();
    const passagens = await coachTeamRepository.getAll();

    for (const coach of coaches) {
      const coachTitles = titles.filter(t => t.coachId === coach.id);
      const coachPassagens = passagens.filter(p => p.coachId === coach.id);
      
      const rankingData = this.calculateCoachRanking(
        coach.id,
        coachTitles,
        coachPassagens,
        weights,
        competitions
      );

      // Salva ou atualiza no Firestore
      await rankingCoachRepository.createOrUpdate(rankingData, coach.id); // usando o coachId como documento ID
    }
  }

  /**
   * Calcula o ranking de um técnico específico
   */
  private calculateCoachRanking(
    coachId: string,
    titles: CoachTitle[],
    passagens: CoachTeam[],
    weights: any[],
    competitions: any[]
  ): Omit<RankingCoach, 'id'> {
    let totalPontos = 0;
    let totalTitulos = titles.length;
    let mundial = 0;
    let continental = 0;
    let nacional = 0;
    let estadual = 0;

    // Calcular pontos por títulos
    for (const title of titles) {
      const comp = competitions.find(c => c.id === title.competitionId);
      const weight = weights.find(w => w.competitionId === title.competitionId);
      
      if (comp && weight) {
        totalPontos += weight.pontosTitulo || 0;

        // Bônus Mundial
        if (comp.tipo === 'Mundial') {
          mundial++;
        } else if (comp.tipo === 'Continental') {
          continental++;
        } else if (comp.tipo === 'Nacional') {
          nacional++;
        } else if (comp.tipo === 'Estadual') {
          estadual++;
        }
      }
    }

    // Calcular totais de jogos e aproveitamento
    let totalJogos = 0;
    let totalVitorias = 0;
    let totalEmpates = 0;
    let totalDerrotas = 0;

    for (const p of passagens) {
      totalJogos += p.jogos || 0;
      totalVitorias += p.vitorias || 0;
      totalEmpates += p.empates || 0;
      totalDerrotas += p.derrotas || 0;
    }

    const aproveitamentoGeral = totalJogos > 0 
      ? ((totalVitorias * 3 + totalEmpates) / (totalJogos * 3)) * 100 
      : 0;

    return {
      coachId,
      totalTitulos,
      totalPontos,
      totalJogos,
      totalVitorias,
      totalEmpates,
      totalDerrotas,
      aproveitamento: parseFloat(aproveitamentoGeral.toFixed(2)),
      mundial,
      continental,
      nacional,
      estadual,
      ultimaAtualizacao: new Date().toISOString()
    };
  }
}

export const rankingService = new RankingService();
