// Página de cadastro
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LogoMark from '../components/LogoMark';
import './Auth.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim().replace(/\s+/g, ' ');
    if (trimmedName.length < 2) {
      setError('Informe um nome com pelo menos 2 caracteres');
      return;
    }

    if (trimmedName.length > 50) {
      setError('O nome deve ter no máximo 50 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await signup(email, password, trimmedName);
      navigate('/');
    } catch (error) {
      if (error.code === 'permission-denied') {
        setError(
          'Permissão negada no Firebase. Atualize as regras do Firestore (veja FIREBASE_RULES.txt).'
        );
      } else {
        setError(
          error.code === 'NAME_TAKEN'
            ? error.message
            : 'Erro ao criar conta: ' + error.message
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-brand">
        <LogoMark className="auth-brand-mark" />
        <h1 className="auth-title">Trackeando</h1>
      </div>
      <div className="auth-card">
        <h2>Cadastrar</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoComplete="name"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        <p className="auth-link">
          Já tem uma conta? <Link to="/login">Entre</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

