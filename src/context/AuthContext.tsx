
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useToast } from '@chakra-ui/react';
import { Profile } from '../lib/supabase-types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const toast = useToast();

  useEffect(() => {
    // Check if Supabase is properly initialized
    const isMissingEnvVars = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (isMissingEnvVars) {
      setIsSupabaseConfigured(false);
      console.error('Missing Supabase environment variables. Authentication will not work.');
      setIsLoading(false);
      return;
    }

    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    }).catch(() => {
      // Handle potential errors when getting the session
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      toast({
        title: 'Supabase not configured',
        description: 'Please connect to Supabase first.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, username: string, name: string) => {
    if (!isSupabaseConfigured) {
      toast({
        title: 'Supabase not configured',
        description: 'Please connect to Supabase first.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username,
            full_name: name,
            updated_at: new Date().toISOString(),
          });

        if (profileError) throw profileError;
      }

      toast({
        title: 'Sign up successful',
        description: 'Please check your email for verification.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!isSupabaseConfigured) return;
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error logging out',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
