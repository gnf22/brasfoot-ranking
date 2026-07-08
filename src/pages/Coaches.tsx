import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { PageContainer, PageHeader } from '../components/common/PageContainer';
import { AppCard, AppCardContent } from '../components/common/AppCard';
import { Modal } from '../components/common/Modal';
import { CoachForm } from '../components/forms/CoachForm';
import { coachRepository } from '../repositories';
import type {  Coach  } from '../models';

export function Coaches() {
  const { isAdmin } = useAuth();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    setIsLoading(true);
    try {
      const data = await coachRepository.getAll();
      setCoaches(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar técnicos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (coach?: Coach) => {
    setSelectedCoach(coach);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCoach(undefined);
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (selectedCoach) {
        await coachRepository.update(selectedCoach.id, data);
        toast.success('Técnico atualizado com sucesso!');
      } else {
        await coachRepository.create(data);
        toast.success('Técnico criado com sucesso!');
      }
      handleCloseModal();
      loadCoaches();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar técnico');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este técnico?')) {
      try {
        await coachRepository.delete(id);
        toast.success('Técnico excluído com sucesso!');
        loadCoaches();
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir técnico');
      }
    }
  };

  const filteredCoaches = coaches.filter(coach => 
    coach.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    coach.nacionalidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer>
      <PageHeader 
        title="Técnicos" 
        description="Gerencie os técnicos de futebol cadastrados no sistema."
        actions={
          isAdmin && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Técnico
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
              placeholder="Buscar por nome ou nacionalidade..."
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <AppCardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Carregando...</p>
            </div>
          ) : filteredCoaches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum técnico encontrado.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nome</th>
                    <th className="px-6 py-3 font-medium">Nacionalidade</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    {isAdmin && <th className="px-6 py-3 font-medium text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCoaches.map((coach) => {
                    return (
                      <tr key={coach.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium">
                          <Link to={`/coaches/${coach.id}`} className="text-primary hover:underline hover:opacity-80 transition-opacity">
                            {coach.nome}
                          </Link>
                        </td>
                        <td className="px-6 py-4">{coach.nacionalidade}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${coach.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {coach.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleOpenModal(coach)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(coach.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y">
                {filteredCoaches.map((coach) => (
                  <div key={coach.id} className="p-4 flex flex-col gap-3 bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link to={`/coaches/${coach.id}`} className="font-semibold text-lg text-primary hover:underline block leading-tight mb-1">
                          {coach.nome}
                        </Link>
                        <div className="text-sm font-medium">Nacionalidade</div>
                        <div className="text-sm">{coach.nacionalidade}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ml-2 ${coach.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {coach.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
                        <button 
                          onClick={() => handleOpenModal(coach)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit className="w-4 h-4" /> Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(coach.id)}
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
        title={selectedCoach ? 'Editar Técnico' : 'Novo Técnico'}
      >
        <CoachForm 
          initialData={selectedCoach} 
          onSubmit={handleSave} 
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>
    </PageContainer>
  );
}
