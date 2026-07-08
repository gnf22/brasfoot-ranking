import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { PageContainer, PageHeader } from '../components/common/PageContainer';
import { AppCard, AppCardContent } from '../components/common/AppCard';
import { Modal } from '../components/common/Modal';
import { NationalTeamForm } from '../components/forms/NationalTeamForm';
import { teamRepository } from '../repositories';
import type { Team } from '../models';

export function NationalTeams() {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const data = await teamRepository.getAll();
      setTeams(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar seleções');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (team?: Team) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTeam(undefined);
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (selectedTeam) {
        await teamRepository.update(selectedTeam.id, data);
        toast.success('Seleção atualizada com sucesso!');
      } else {
        await teamRepository.create(data);
        toast.success('Seleção criada com sucesso!');
      }
      handleCloseModal();
      loadTeams();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar seleção');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta seleção?')) {
      try {
        await teamRepository.delete(id);
        toast.success('Seleção excluída com sucesso!');
        loadTeams();
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir seleção');
      }
    }
  };

  const filteredTeams = teams.filter(team => 
    team.tipo === 'Selecao' &&
    (team.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (team.confederacao && team.confederacao.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Group teams by confederacao
  const groupedTeams = filteredTeams.reduce((acc, team) => {
    const conf = team.confederacao || 'Sem Confederação';
    if (!acc[conf]) acc[conf] = [];
    acc[conf].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  const sortedConfederations = Object.keys(groupedTeams).sort();

  return (
    <PageContainer>
      <PageHeader 
        title="Seleções" 
        description="Gerencie as seleções cadastradas no sistema."
        actions={
          isAdmin && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Seleção
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
              placeholder="Buscar por seleção ou confederação..."
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <AppCardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Carregando...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma seleção encontrada.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {sortedConfederations.map((conf) => (
                <div key={conf} className="mb-4">
                  <div className="bg-muted/50 px-6 py-2 border-b border-t font-semibold text-sm text-foreground">
                    {conf}
                  </div>
                  
                  {/* DESKTOP TABLE */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase text-muted-foreground border-b bg-background">
                        <tr>
                          <th className="px-6 py-3 font-medium">Seleção</th>
                          <th className="px-6 py-3 font-medium">Cores</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          {isAdmin && <th className="px-6 py-3 font-medium text-right">Ações</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {groupedTeams[conf].map((team) => (
                          <tr key={team.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-medium flex items-center gap-3">
                              {team.escudo ? (
                                <img src={team.escudo} alt={team.nome} className="w-8 h-8 object-contain" />
                              ) : (
                                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-bold">
                                  {team.nome.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <Link to={`/national-teams/${team.id}`} className="text-primary hover:underline hover:opacity-80 transition-opacity">
                                {team.nome}
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: team.corPrimaria || '#ff0000' }} title="Cor Primária" />
                                <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: team.corSecundaria || '#000000' }} title="Cor Secundária" />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${team.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {team.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleOpenModal(team)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(team.id)}
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
                  <div className="md:hidden divide-y divide-border">
                    {groupedTeams[conf].map((team) => (
                      <div key={team.id} className="p-4 flex flex-col gap-3 bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {team.escudo ? (
                              <img src={team.escudo} alt={team.nome} className="w-10 h-10 object-contain" />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                                {team.nome.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <Link to={`/national-teams/${team.id}`} className="font-semibold text-lg text-primary hover:underline block leading-tight">
                                {team.nome}
                              </Link>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="w-3.5 h-3.5 rounded-full border shadow-sm" style={{ backgroundColor: team.corPrimaria || '#ff0000' }} />
                                <div className="w-3.5 h-3.5 rounded-full border shadow-sm" style={{ backgroundColor: team.corSecundaria || '#000000' }} />
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ml-2 ${team.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {team.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        
                        {isAdmin && (
                          <div className="flex justify-end gap-2 pt-2 border-t border-muted/50 mt-1">
                            <button 
                              onClick={() => handleOpenModal(team)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Edit className="w-4 h-4" /> Editar
                            </button>
                            <button 
                              onClick={() => handleDelete(team.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AppCardContent>
      </AppCard>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={selectedTeam ? 'Editar Seleção' : 'Nova Seleção'}
      >
        <NationalTeamForm 
          initialData={selectedTeam} 
          onSubmit={handleSave} 
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>
    </PageContainer>
  );
}
