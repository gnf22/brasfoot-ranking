import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { PageContainer, PageHeader } from '../components/common/PageContainer';
import { AppCard, AppCardContent } from '../components/common/AppCard';
import { Modal } from '../components/common/Modal';
import { SeasonForm } from '../components/forms/SeasonForm';
import { seasonRepository } from '../repositories';
import type {  Season  } from '../models';

export function Seasons() {
  const { isAdmin } = useAuth();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<Season | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    setIsLoading(true);
    try {
      const data = await seasonRepository.getAll();
      setSeasons(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar temporadas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (season?: Season) => {
    setSelectedSeason(season);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSeason(undefined);
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (selectedSeason) {
        await seasonRepository.update(selectedSeason.id, data);
        toast.success('Temporada atualizada com sucesso!');
      } else {
        await seasonRepository.create(data);
        toast.success('Temporada criada com sucesso!');
      }
      handleCloseModal();
      loadSeasons();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar temporada');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta temporada?')) {
      try {
        await seasonRepository.delete(id);
        toast.success('Temporada excluída com sucesso!');
        loadSeasons();
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir temporada');
      }
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Temporadas" 
        description="Gerencie os anos e os períodos de avaliação."
        actions={
          isAdmin && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Temporada
            </button>
          )
        }
      />

      <AppCard>
        <AppCardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Carregando...</p>
            </div>
          ) : seasons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma temporada encontrada.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Descrição</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    {isAdmin && <th className="px-6 py-3 font-medium text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {seasons.map((season) => (
                    <tr key={season.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <Link to={`/seasons/${season.id}`} className="text-primary hover:underline hover:opacity-80 transition-opacity">
                          {season.descricao}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${season.ativa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {season.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleOpenModal(season)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(season.id)}
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
                {seasons.map((season) => (
                  <div key={season.id} className="p-4 flex flex-col gap-3 bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <Link to={`/seasons/${season.id}`} className="font-semibold text-lg text-primary hover:underline block leading-tight">
                        Temporada {season.anoInicio}
                      </Link>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ml-2 ${season.ativa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {season.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-muted/50 mt-1">
                        <button 
                          onClick={() => handleOpenModal(season)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit className="w-4 h-4" /> Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(season.id)}
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
        title={selectedSeason ? 'Editar Temporada' : 'Nova Temporada'}
      >
        <SeasonForm 
          initialData={selectedSeason} 
          onSubmit={handleSave} 
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>
    </PageContainer>
  );
}
