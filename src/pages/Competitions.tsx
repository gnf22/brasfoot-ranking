import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { PageContainer, PageHeader } from '../components/common/PageContainer';
import { AppCard, AppCardContent } from '../components/common/AppCard';
import { Modal } from '../components/common/Modal';
import { CompetitionForm } from '../components/forms/CompetitionForm';
import { competitionRepository } from '../repositories';
import type {  Competition  } from '../models';

export function Competitions() {
  const { isAdmin } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    setIsLoading(true);
    try {
      const data = await competitionRepository.getAll();
      setCompetitions(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar competições');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (competition?: Competition) => {
    setSelectedCompetition(competition);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompetition(undefined);
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (selectedCompetition) {
        await competitionRepository.update(selectedCompetition.id, data);
        toast.success('Competição atualizada com sucesso!');
      } else {
        await competitionRepository.create(data);
        toast.success('Competição criada com sucesso!');
      }
      handleCloseModal();
      loadCompetitions();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar competição');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta competição?')) {
      try {
        await competitionRepository.delete(id);
        toast.success('Competição excluída com sucesso!');
        loadCompetitions();
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir competição');
      }
    }
  };

  const compOrder: Record<string, number> = {
    'Seleções': 1,
    'Mundial': 2,
    'Continental': 3,
    'Nacional': 4,
    'Copa': 5,
    'Supercopa': 6
  };

  const filteredCompetitions = competitions.filter(comp => 
    comp.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (comp.pais || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const orderA = compOrder[a.tipo] || 99;
    const orderB = compOrder[b.tipo] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.nome.localeCompare(b.nome);
  });

  const renderLocal = (comp: Competition) => {
    if (comp.tipo === 'Mundial') return 'Mundial';
    if (comp.tipo === 'Continental') return comp.continente;
    if (comp.pais && comp.continente) return `${comp.pais} - ${comp.continente}`;
    if (comp.pais) return comp.pais;
    return comp.continente || '-';
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Competições" 
        description="Gerencie as competições disponíveis no sistema."
        actions={
          isAdmin && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Competição
            </button>
          )
        }
      />

      <AppCard>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, país ou tipo..."
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <AppCardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Carregando...</p>
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma competição encontrada.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nome</th>
                    <th className="px-6 py-3 font-medium">Tipo</th>
                    <th className="px-6 py-3 font-medium">Local</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    {isAdmin && <th className="px-6 py-3 font-medium text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCompetitions.map((comp) => (
                    <tr key={comp.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        {comp.logo ? (
                          <img src={comp.logo} alt={comp.nome} className="w-6 h-6 object-contain" />
                        ) : null}
                        <div>
                          <p>
                            <Link to={`/competitions/${comp.id}`} className="hover:underline text-primary font-semibold">
                              {comp.nome}
                            </Link>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{comp.tipo}</td>
                      <td className="px-6 py-4">{renderLocal(comp)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${comp.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {comp.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleOpenModal(comp)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(comp.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y">
                {filteredCompetitions.map((comp) => (
                  <div key={comp.id} className="p-4 flex flex-col gap-3 bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {comp.logo ? (
                          <img src={comp.logo} alt={comp.nome} className="w-8 h-8 object-contain" />
                        ) : null}
                        <div>
                          <Link to={`/competitions/${comp.id}`} className="font-semibold text-lg text-primary hover:underline block leading-tight">
                            {comp.nome}
                          </Link>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ml-2 ${comp.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {comp.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Tipo</span>
                        <span className="font-medium">{comp.tipo}</span>
                      </div>
                      <div className="col-span-1">
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Local</span>
                        <span className="font-medium">{renderLocal(comp)}</span>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex justify-end gap-2 pt-3 border-t border-muted/50 mt-1">
                        <button 
                          onClick={() => handleOpenModal(comp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit className="w-4 h-4" /> Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(comp.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </AppCardContent>
      </AppCard>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={selectedCompetition ? 'Editar Competição' : 'Nova Competição'}
      >
        <CompetitionForm 
          initialData={selectedCompetition} 
          onSubmit={handleSave} 
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>
    </PageContainer>
  );
}
