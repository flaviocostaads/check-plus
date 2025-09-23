import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator';
  user_id: string;
  created_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthContext: Fetching user profile...');
          await fetchUserProfile(session.user.id, session.user);
        } else {
          console.log('AuthContext: No session, clearing profile');
          setUserProfile(null);
        }
        
        console.log('AuthContext: Setting loading to false');
        setLoading(false);
      }
    );

    // Check for existing session
    const checkSession = async () => {
      console.log('AuthContext: Checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthContext: Found session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('AuthContext: Fetching user profile from existing session...');
        await fetchUserProfile(session.user.id, session.user);
      }
      
      console.log('AuthContext: Initial check complete, setting loading to false');
      setLoading(false);
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, currentUser: SupabaseUser) => {
    try {
      console.log('AuthContext: Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        console.log('AuthContext: Profile found:', data.email, data.role);
        setUserProfile(data);
      } else {
        console.log('AuthContext: No profile found, creating new one...');
        // Create default admin profile for new users
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            user_id: userId,
            email: currentUser?.email || '',
            name: currentUser?.email || '',
            role: 'admin'
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        } else {
          console.log('AuthContext: Created new profile:', newProfile.email, newProfile.role);
          setUserProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
    navigate('/');
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};