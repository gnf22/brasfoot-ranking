# Sistema de Ranking de Técnicos de Futebol

## Objetivo

Sistema para cadastro de técnicos, clubes, temporadas, passagens, títulos e um ranking automático baseado em pesos configuráveis para cada competição.

---

# MODELS

## Coach

Representa o treinador.

### Campos

- id
- nome
- nomeCompleto
- foto
- nacionalidade
- dataNascimento
- cidadeNascimento
- estadoNascimento
- paisNascimento
- biografia
- ativo
- dataCriacao
- dataAtualizacao

### Relacionamentos

- possui muitas Passagens
- possui muitos Títulos
- possui muitas Temporadas
- possui muitas Premiações

---

## Team

Cadastro dos clubes.

### Campos

- id
- nome
- nomeCurto
- escudo
- cidade
- estado
- pais
- fundacao
- estadio
- cores
- ativo

### Relacionamentos

- possui muitas Passagens
- disputa muitas Competições

---

## Competition

Cadastro das competições.

### Campos

- id
- nome
- nomeCurto
- tipo
- continente
- pais
- nivel
- logo
- ativo

### Tipo

- Mundial
- Continental
- Nacional
- Estadual
- Regional
- Copa
- Supercopa
- Outro

### Relacionamentos

- possui muitos Títulos
- possui Peso

---

## CompetitionWeight

Define o peso da competição no ranking.

### Campos

- id
- competitionId
- pontosTitulo
- pontosVice
- pontosTerceiro
- pontosParticipacao

### Exemplo

| Competição | Peso |
|------------|------|
| Mundial | 100 |
| Libertadores | 80 |
| Champions League | 80 |
| Campeonato Brasileiro | 60 |
| Copa do Brasil | 45 |
| Estadual | 10 |

---

## Season

Cadastro das temporadas.

### Campos

- id
- descricao
- anoInicio
- anoFim
- ativa

### Exemplos

- 2025
- 2025/26
- 2026

---

## CoachTeam

Representa uma passagem do treinador por um clube.

### Campos

- id
- coachId
- teamId
- dataInicio
- dataFim
- temporadaInicial
- temporadaFinal
- jogos
- vitorias
- empates
- derrotas
- golsMarcados
- golsSofridos
- aproveitamento
- observacoes

### Relacionamentos

- pertence a Coach
- pertence a Team

---

## CoachTitle

Título conquistado.

### Campos

- id
- coachId
- teamId
- competitionId
- seasonId
- dataTitulo
- observacoes

### Relacionamentos

- pertence a Coach
- pertence a Team
- pertence a Competition
- pertence a Season

---

## Award

Premiações individuais.

### Campos

- id
- coachId
- nome
- ano
- organizacao
- peso

### Exemplos

- Melhor Técnico FIFA
- Melhor Técnico CONMEBOL
- Melhor Técnico CBF

---

# RANKING

## RankingCoach

Tabela calculada automaticamente.

### Campos

- coachId
- totalTitulos
- totalPontos
- totalJogos
- totalVitorias
- totalEmpates
- totalDerrotas
- aproveitamento
- mundial
- continental
- nacional
- estadual
- ultimaAtualizacao

---

# REGRAS

## Cálculo do Ranking

### Pontuação Total

```
Total =
Soma(
Peso da Competição
+
Bônus opcionais
)
```

---

### Bônus

#### Mundial

+20 pontos

#### Invicto

+15 pontos

#### Tríplice Coroa

+25 pontos

#### Mais de 70% de aproveitamento na temporada

+10 pontos

---

# DASHBOARD

## Página Inicial

### Cards

- Total de Técnicos
- Total de Clubes
- Total de Títulos
- Total de Competições
- Total de Temporadas

---

## Ranking Geral

Tabela

- Posição
- Foto
- Técnico
- Pontos
- Títulos
- Aproveitamento
- Clubes Treinados

Ordenação

- Maior pontuação
- Mais títulos
- Melhor aproveitamento

---

## Perfil do Técnico

### Dados

- Foto
- Nome
- Nacionalidade
- Idade
- Biografia

### Estatísticas

- Jogos
- Vitórias
- Empates
- Derrotas
- Aproveitamento

### Clubes

Lista cronológica

- Clube
- Data inicial
- Data final
- Jogos
- Aproveitamento

### Títulos

Tabela

- Competição
- Clube
- Temporada
- Peso recebido

### Premiações

Lista

### Evolução por temporada

Gráfico de pontos

---

# FILTROS

### Ranking

- País
- Nacionalidade
- Clube
- Competição
- Continente
- Temporada
- Apenas técnicos ativos

---

# RELATÓRIOS

## Técnicos com mais títulos

## Técnicos com mais pontos

## Técnicos por país

## Clubes que mais conquistaram títulos com técnicos cadastrados

## Histórico completo de passagens

## Ranking por temporada

## Ranking por competição

---

# CONFIGURAÇÕES

## Pesos

Administrador poderá alterar os pesos de qualquer competição.

Exemplo

- Mundial = 100
- Libertadores = 80
- Champions = 80
- Brasileirão = 60
- Copa do Brasil = 45
- Recopa = 30
- Supercopa = 20
- Estadual = 10

Ao alterar um peso, todo o ranking deverá ser recalculado automaticamente.

---

# RELACIONAMENTO DAS ENTIDADES

Coach

→ CoachTeam

→ Team

↓

CoachTitle

↓

Competition

↓

CompetitionWeight

↓

Season

↓

RankingCoach

Coach

↓

Award