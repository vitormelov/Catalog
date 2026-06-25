import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserPrivacySettings } from '../services/firestoreService';
import { userShowsCostsToFriends } from '../utils/friendHelpers';
import './Account.css';

const Account = () => {
  const { currentUser, userProfile, userName, refreshUserProfile } = useAuth();
  const [showCostsToFriends, setShowCostsToFriends] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setShowCostsToFriends(userShowsCostsToFriends(userProfile));
  }, [userProfile]);

  const handleShowCostsChange = async (event) => {
    const nextValue = event.target.checked;
    const previousValue = showCostsToFriends;

    setShowCostsToFriends(nextValue);
    setSaving(true);
    setError('');

    try {
      await updateUserPrivacySettings(currentUser.uid, {
        showCostsToFriends: nextValue,
      });
      await refreshUserProfile();
    } catch (saveError) {
      console.error('Erro ao salvar preferência de privacidade:', saveError);
      setShowCostsToFriends(previousValue);
      setError('Não foi possível salvar a preferência. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-container">
      <h1>Conta</h1>
      <p className="account-subtitle">Configurações do perfil e privacidade.</p>

      <section className="account-section">
        <h2>Perfil</h2>
        <p className="account-field">
          <span className="account-field-label">Nome</span>
          <span className="account-field-value">{userName || '—'}</span>
        </p>
        <p className="account-field">
          <span className="account-field-label">E-mail</span>
          <span className="account-field-value">{currentUser?.email || '—'}</span>
        </p>
      </section>

      <section className="account-section">
        <h2>Privacidade</h2>
        <label className="account-checkbox">
          <input
            type="checkbox"
            checked={showCostsToFriends}
            onChange={handleShowCostsChange}
            disabled={saving}
          />
          <span className="account-checkbox-text">
            <strong>Mostrar custos aos amigos</strong>
            <span className="account-checkbox-hint">
              Quando desmarcado, amigos não veem valores na sua coleção de mangás.
            </span>
          </span>
        </label>
        {error && <p className="account-error">{error}</p>}
      </section>
    </div>
  );
};

export default Account;
