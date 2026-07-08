import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageContainer, PageHeader } from '../components/common/PageContainer';
import { AppCard, AppCardContent } from '../components/common/AppCard';
import { competitionRepository, competitionWeightRepository } from '../repositories';
import type {  Competition, CompetitionWeight  } from '../models';

export function Settings() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [weights, setWeights] = useState<Record<string, Omit<CompetitionWeight, 'id'>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [compsData, weightsData] = await Promise.all([
        competitionRepository.getAll(),
        competitionWeightRepository.getAll()
      ]);
      
      setCompetitions(compsData);
      
      const weightsMap: Record<string, Omit<CompetitionWeight, 'id'>> = {};
      weightsData.forEach(w => {
        weightsMap[w.competitionId] = {
          competitionId: w.competitionId,
          pontosTitulo: w.pontosTitulo
        };
      });
      setWeights(weightsMap);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (competitionId: string, field: keyof Omit<CompetitionWeight, 'id' | 'competitionId'>, value: string) => {
    setWeights(prev => ({
      ...prev,
      [competitionId]: {
        ...(prev[competitionId] || { competitionId, pontosTitulo: 0 }),
        [field]: Number(value) || 0
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const weightsToSave = Object.values(weights);
      await competitionWeightRepository.saveAll(weightsToSave);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Configurações" 
        description="Ajuste os pesos e pontuações do ranking."
        actions={
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        }
      />

      <AppCard>
        <AppCardContent className="p-0">
          <div className="p-6 border-b bg-muted/20">
            <h3 className="text-lg font-semibold">Pesos das Competições</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Defina os pontos que os técnicos ganham ao vencer cada competição. 
              Isso afetará o cálculo geral do ranking.
            </p>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Carregando...</p>
            </div>
          ) : competitions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma competição cadastrada. Cadastre competições primeiro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Competição</th>
                    <th className="px-6 py-3 font-medium text-center">Pontos Título</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...competitions].sort((a, b) => {
                    const compOrder: Record<string, number> = {
                      'Seleções': 1,
                      'Mundial': 2,
                      'Continental': 3,
                      'Nacional': 4,
                      'Copa': 5,
                      'Supercopa': 6
                    };
                    const orderA = compOrder[a.tipo] || 99;
                    const orderB = compOrder[b.tipo] || 99;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.nome.localeCompare(b.nome);
                  }).map((comp) => {
                    const weight = weights[comp.id] || { pontosTitulo: 0 };
                    
                    return (
                      <tr key={comp.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium">
                          <p>{comp.nome}</p>
                          <p className="text-xs text-muted-foreground">{comp.tipo}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number" 
                            min="0"
                            className="w-20 px-2 py-1 border rounded text-center focus:ring-1 focus:ring-primary focus:outline-none bg-background"
                            value={weight.pontosTitulo}
                            onChange={(e) => handleWeightChange(comp.id, 'pontosTitulo', e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AppCardContent>
      </AppCard>
    </PageContainer>
  );
}
