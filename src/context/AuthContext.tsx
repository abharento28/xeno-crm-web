import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User as SupabaseUser } from '@supabase/auth-js';
import { getSiteUrl, isProduction } from '../utils/authRedirect';

interface User extends SupabaseUser {
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: () => {},
  logout: () => {}
});

// Safely get environment variables with fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Check for missing config
const isMissingConfig = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// Get the correct site URL for OAuth redirects
const SITE_URL = getSiteUrl();

console.log('Auth environment:', isProduction() ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('Site URL for auth:', SITE_URL);

// Only create the client if config exists
const supabase = isMissingConfig 
  ? null 
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Site-URL': SITE_URL
        }
      }
    });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AuthProvider: Initializing authentication');
    
    // Skip auth initialization if config is missing
    if (isMissingConfig) {
      console.warn('Supabase config is missing. Authentication is disabled.');
      setError('Authentication configuration is missing.');
      setLoading(false);
      return;
    }

    try {
      // Check if URL contains a hash with error=unauthorized or similar
      if (window.location.hash && window.location.hash.includes('error=')) {
        console.error('Auth error in URL:', window.location.hash);
        const errorMessage = 'Authentication error occurred. Please try again.';
        setError(errorMessage);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check for access_token in hash (manual handling in case autodetection fails)
      if (window.location.hash && window.location.hash.includes('access_token=')) {
        console.log('AuthProvider: Detected access_token in URL hash');
      }

      const initAuth = async () => {
        console.log('AuthProvider: Getting session');
        // First try to get the current session
        const { data: sessionData, error: sessionError } = await supabase!.auth.getSession();
        
        if (sessionError) {
          console.error('Session retrieval error:', sessionError.message);
          setError(sessionError.message);
          setLoading(false);
          return;
        }
        
        // Update user based on current session
        if (sessionData?.session) {
          console.log('AuthProvider: Found existing session', sessionData.session);
          setUser(sessionData.session.user);
          setLoading(false);
        } else {
          console.log('AuthProvider: No existing session found');
        }
        
        // Set up the auth state change listener
        const { data: authListener } = supabase!.auth.onAuthStateChange((event, session) => {
          console.log('AuthProvider: Auth state changed', event);
          
          if (event === 'SIGNED_IN') {
            console.log('User signed in successfully', session?.user);
            setUser(session?.user || null);
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed', session?.user);
            setUser(session?.user || null);
          }
          
          setLoading(false);
        });

        return () => {
          authListener?.subscription.unsubscribe();
        };
      };

      initAuth();
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown authentication error');
      setLoading(false);
    }
  }, []);

  const login = async () => {
    if (isMissingConfig || !supabase) {
      setError('Cannot log in: Authentication is not configured properly.');
      return;
    }

    try {
      console.log(`Starting OAuth login with redirect to: ${SITE_URL}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: SITE_URL,
          queryParams: {
            // Add a unique identifier to avoid caching issues
            prompt: 'select_account',
            ts: Date.now().toString()
          }
        }
      });
      
      if (error) {
        console.error('Login error:', error.message);
        setError(error.message);
      } else {
        console.log('Login initiated, redirecting to provider...');
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError(err instanceof Error ? err.message : 'Unknown login error');
    }
  };

  const logout = async () => {
    if (isMissingConfig || !supabase) {
      setError('Cannot log out: Authentication is not configured properly.');
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
        setError(error.message);
      }
      setUser(null);
    } catch (err) {
      console.error('Logout exception:', err);
      setError(err instanceof Error ? err.message : 'Unknown logout error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);