import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
    adminChecked: false,
  });

  const checkAdminRole = useCallback(async (_userId: string) => {
    try {
      // Try the recommended RPC; fall back to a direct read of user_roles
      let isAdmin = false;
      const { data, error } = await supabase.rpc('current_user_has_role', { _role: 'admin' });
      if (!error) {
        isAdmin = data === true;
      } else {
        console.error('current_user_has_role failed, falling back:', error.message);
        const { data: row } = await supabase
          .from('user_roles').select('id')
          .eq('user_id', _userId).eq('role', 'admin').maybeSingle();
        isAdmin = !!row;
      }
      setAuthState(prev => ({
        ...prev,
        isAdmin,
        adminChecked: true,
        loading: false,
      }));
    } catch (err) {
      console.error('Error checking admin role:', err);
      setAuthState(prev => ({ 
        ...prev, 
        isAdmin: false,
        adminChecked: true,
        loading: false
      }));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      if (session?.user) {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session.user,
        }));
        checkAdminRole(session.user.id);
      } else {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAdmin: false,
          adminChecked: true,
        });
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        if (session?.user) {
          setAuthState(prev => ({
            ...prev,
            session,
            user: session.user,
          }));
          // Defer admin check to avoid race conditions
          setTimeout(() => {
            if (isMounted) {
              checkAdminRole(session.user.id);
            }
          }, 0);
        } else {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAdmin: false,
            adminChecked: true,
          });
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthState({
      user: null,
      session: null,
      loading: false,
      isAdmin: false,
      adminChecked: true,
    });
  };

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    isAdmin: authState.isAdmin,
    adminChecked: authState.adminChecked,
    signOut,
  };
};
