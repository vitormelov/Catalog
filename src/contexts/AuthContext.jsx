// Contexto de autenticação
import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserProfile, getUserProfile } from '../services/firestoreService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Erro ao carregar perfil:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, name) => {
    const trimmedName = name.trim().replace(/\s+/g, ' ');
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    try {
      await updateProfile(credential.user, { displayName: trimmedName });
      await createUserProfile(credential.user.uid, {
        name: trimmedName,
        email,
      });
      setUserProfile({
        userId: credential.user.uid,
        name: trimmedName,
        email,
        showCostsToFriends: true,
      });
    } catch (error) {
      await credential.user.delete();
      throw error;
    }

    return credential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const refreshUserProfile = async () => {
    if (!currentUser) return null;
    const profile = await getUserProfile(currentUser.uid);
    setUserProfile(profile);
    return profile;
  };

  const userName =
    userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';

  const value = {
    currentUser,
    userProfile,
    userName,
    signup,
    login,
    logout,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

