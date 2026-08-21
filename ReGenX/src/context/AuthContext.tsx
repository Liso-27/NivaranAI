import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { disasterApi } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string, role: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerCitizen: (data: {
    name: string;
    email: string;
    password?: string;
    phone_number?: string;
    notification_sms_enabled?: boolean;
  }) => Promise<void>;
  registerOfficial: (data: {
    name: string;
    email: string;
    password?: string;
    department: string;
    designation: string;
    employee_id?: string;
    phone_number?: string;
  }) => Promise<void>;
  updateSmsPreference: (enabled: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('nivaran_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('nivaran_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nivaran_user');
    }
  }, [user]);

  const login = async (emailOrPhone: string, password: string, requestedRole: UserRole) => {
    setIsLoading(true);
    try {
      const res = await disasterApi.login(emailOrPhone, password);
      localStorage.setItem('auth_session_token', res.session_token);
      // Ensure role matches requested context or throw error
      if (res.user.role !== requestedRole && requestedRole !== 'CITIZEN') {
         // Citizens can be admins, but if you request admin you must be admin.
         if (res.user.role !== 'SYSTEM_ADMIN' && requestedRole === 'SYSTEM_ADMIN') {
            throw new Error("Access Denied: You do not have System Admin privileges.");
         }
         if (res.user.role !== 'GOVERNMENT_OFFICIAL' && requestedRole === 'GOVERNMENT_OFFICIAL') {
            throw new Error("Access Denied: You do not have Government Official privileges.");
         }
      }
      setUser(res.user);
    } catch (err: any) {
      console.error("Login Error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      if (!firebaseUser) throw new Error('Google Sign-In completed without user credentials.');
      
      const idToken = await firebaseUser.getIdToken();
      const res = await disasterApi.loginWithGoogle(idToken);
      localStorage.setItem('auth_session_token', res.session_token);
      setUser(res.user);
    } catch (err: any) {
      console.error('Firebase Google Sign-In Failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerCitizen = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await disasterApi.registerCitizen(data);
      // Wait for user to manually login after registration or auto-login
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerOfficial = async (data: any) => {
    setIsLoading(true);
    try {
      await disasterApi.registerOfficial({
          ...data,
          employee_id: data.employee_id || 'TEMP-ID'
      });
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSmsPreference = async (enabled: boolean) => {
    if (!user) return;
    try {
      await disasterApi.updateCitizenPreferences({ notification_sms_enabled: enabled });
      setUser((prev) => (prev ? { ...prev, notification_sms_enabled: enabled } : null));
    } catch (err) {
      console.error("Failed to update SMS preference:", err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase sign-out note:', e);
    }
    setUser(null);
    localStorage.removeItem('nivaran_user');
    localStorage.removeItem('auth_session_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : 'CITIZEN',
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        registerCitizen,
        registerOfficial,
        updateSmsPreference,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
