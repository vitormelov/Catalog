// Página de gerenciamento de grupos (dentro de coleções)
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserGroups,
  getUserCollections,
  createGroup,
  updateGroup,
  deleteGroup,
  getMangaByGroup,
  getGroupTotalCost
} from '../services/firestoreService';
import GroupCard from '../components/GroupCard';
import GroupModal from '../components/GroupModal';
import './Groups.css';

const Groups = () => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [grps, cols] = await Promise.all([
        getUserGroups(currentUser.uid),
        getUserCollections(currentUser.uid)
      ]);
      setCollections(cols);
      
      // Carregar custos totais para cada grupo
      const groupsWithCosts = await Promise.all(
        grps.map(async (group) => {
          const totalCost = await getGroupTotalCost(group.id);
          const mangas = await getMangaByGroup(group.id);
          return {
            ...group,
            totalCost,
            mangaCount: mangas.length
          };
        })
      );
      setGroups(groupsWithCosts);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setShowModal(true);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setShowModal(true);
  };

  const handleSave = async (groupData) => {
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, groupData);
      } else {
        if (!groupData.collectionId) {
          alert('Selecione uma coleção para o grupo');
          return;
        }
        await createGroup(currentUser.uid, groupData.collectionId, groupData);
      }
      setShowModal(false);
      setEditingGroup(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      alert('Erro ao salvar grupo. Tente novamente.');
    }
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Tem certeza que deseja deletar este grupo?')) {
      return;
    }

    try {
      await deleteGroup(groupId);
      loadData();
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      alert('Erro ao deletar grupo. Tente novamente.');
    }
  };

  const filteredGroups = selectedCollection
    ? groups.filter(g => g.collectionId === selectedCollection)
    : groups;

  if (loading) {
    return <div className="loading">Carregando grupos...</div>;
  }

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h1>Meus Grupos</h1>
        <button onClick={handleCreate} className="create-btn">
          + Novo Grupo
        </button>
      </div>

      {collections.length > 0 && (
        <div className="filter-section">
          <label>Filtrar por Coleção:</label>
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas as Coleções</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <div className="empty-state">
          <p>
            {selectedCollection 
              ? 'Esta coleção não tem grupos. Crie um para começar!' 
              : 'Você ainda não tem grupos. Crie um para começar!'}
          </p>
        </div>
      ) : (
        <div className="groups-grid">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onEdit={() => handleEdit(group)}
              onDelete={() => handleDelete(group.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <GroupModal
          group={editingGroup}
          collections={collections}
          onClose={() => {
            setShowModal(false);
            setEditingGroup(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Groups;
