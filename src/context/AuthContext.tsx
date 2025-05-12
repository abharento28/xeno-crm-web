import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User as SupabaseUser } from '@supabase/auth-js';

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

// Only create the client if config exists
const supabase = isMissingConfig 
  ? null 
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
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
      // Check if we're coming back from an OAuth redirect with hash params
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('Detected hash params in URL, handling redirect...');
        
        // If we're on localhost during development, this is expected
        // But if we're on Vercel with localhost in the URL, we need to fix the URL
        if (window.location.origin.includes('vercel.app') && 
            window.location.hash.includes('localhost')) {
          // Replace localhost with actual Vercel domain in the hash
          const fixedHash = window.location.hash.replace(
            /localhost:3000/g, 
            window.location.host
          );
          // Update URL without reloading
          window.history.replaceState(
            null, 
            document.title, 
            window.location.pathname + fixedHash
          );
          console.log('Fixed redirect URL hash params');
        }
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
          console.log('AuthProvider: Found existing session');
          setUser(sessionData.session.user);
          setLoading(false);
        } else {
          console.log('AuthProvider: No existing session found');
        }
        
        // Set up the auth state change listener
        const { data: authListener } = supabase!.auth.onAuthStateChange((event, session) => {
          console.log('AuthProvider: Auth state changed', event);
          setUser(session?.user || null);
          setLoading(false);
          
          // If we just got a URL-based login redirect, refresh the page to avoid 404s
          // This helps with Vercel deployments where the hash-based redirect can cause issues
          if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
            console.log('AuthProvider: Detected URL-based login, redirecting to root path');
            
            // Clear the hash and redirect to the root path
            window.location.href = window.location.origin + '/';
          }
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
      // Get the current deployment URL (Vercel or localhost)
      const deploymentUrl = window.location.origin;
      console.log('Current deployment URL:', deploymentUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: deploymentUrl,
          // Skip the URL fragment which may cause routing issues
          skipBrowserRedirect: false
        }
      });
      
      if (error) {
        console.error('Login error:', error.message);
        setError(error.message);
      } else {
        console.log('Login initiated, redirecting to provider...', data);
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