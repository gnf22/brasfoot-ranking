export interface Coach {
  id: string;
  nome: string;
  nacionalidade: string;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Team {
  id: string;
  nome: string;
  escudo: string;
  corPrimaria: string;
  corSecundaria: string;
  ativo: boolean;
  tipo?: 'Clube' | 'Selecao';
  pais?: string;
  confederacao?: string;
}

export type CompetitionType =
  | 'Seleções'
  | 'Mundial'
  | 'Continental'
  | 'Nacional'
  | 'Copa'
  | 'Supercopa';

export interface Competition {
  id: string;
  nome: string;
  nomeCurto?: string;
  tipo: CompetitionType;
  continente?: string;
  pais?: string;
  nivel?: number;
  logo?: string;
  logoTrofeu?: string;
  ativo: boolean;
}

export interface CompetitionWeight {
  id: string;
  competitionId: string;
  pontosTitulo: number;
  pontosVice?: number;
  pontosTerceiro?: number;
  pontosParticipacao?: number;
}

export interface Season {
  id: string;
  descricao: string;
  anoInicio: number;
  anoFim: number;
  ativa: boolean;
}

export interface CoachTeamYearStat {
  ano: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsMarcados: number;
  golsSofridos: number;
}

export interface CoachTeam {
  id: string;
  coachId: string;
  teamId: string;
  anoInicio: number;
  anoFim?: number;
  clubeAtual: boolean;
  estatisticasPorAno: CoachTeamYearStat[];
  
  // Totais agregados (para facilitar consultas)
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsMarcados: number;
  golsSofridos: number;
  aproveitamento: number;
  observacoes: string;
}

export interface CoachTitle {
  id: string;
  coachId: string;
  teamId: string;
  competitionId: string;
  seasonId: string;
  observacoes: string;
}

export interface TeamTitle {
  id: string;
  teamId: string;
  competitionId: string;
  seasonId: string;
  observacoes: string;
}

export interface CoachRelegation {
  id: string;
  coachId: string;
  teamId: string;
  seasonId: string;
  competition?: string;
  observacoes: string;
}

export interface Award {
  id: string;
  coachId: string;
  nome: string;
  ano: number;
  organizacao: string;
  peso: number;
}

export interface RankingCoach {
  coachId: string;
  totalTitulos: number;
  totalPontos: number;
  totalJogos: number;
  totalVitorias: number;
  totalEmpates: number;
  totalDerrotas: number;
  aproveitamento: number;
  mundial: number;
  continental: number;
  nacional: number;
  estadual: number;
  ultimaAtualizacao: string;
}
