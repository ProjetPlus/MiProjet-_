import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  duration_type: string;
  duration_days: number;
  price: number;
  currency: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  payment_id: string | null;
  auto_renew: boolean;
  plan?: SubscriptionPlan;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setPlans(data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? (plan.features as string[]) : []
      })));
    }
  }, []);

  const fetchCurrentSubscription = useCallback(async () => {
    if (!user) {
      setCurrentSubscription(null);
      setHasActiveSubscription(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setCurrentSubscription(data as any);
      setHasActiveSubscription(true);
    } else {
      setCurrentSubscription(null);
      setHasActiveSubscription(false);
    }
  }, [user]);

  const checkSubscriptionAccess = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    const { data } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();
    
    return !!data;
  }, [user]);

  const createSubscription = async (planId: string, paymentId?: string) => {
    if (!user) return { error: 'User not authenticated' };

    const plan = plans.find(p => p.id === planId);
    if (!plan) return { error: 'Plan not found' };

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.duration_days);

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: paymentId ? 'active' : 'pending',
        started_at: paymentId ? startDate.toISOString() : null,
        expires_at: paymentId ? expiryDate.toISOString() : null,
        payment_id: paymentId || null,
      })
      .select()
      .single();

    if (!error) {
      await fetchCurrentSubscription();
    }

    return { data, error };
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPlans(), fetchCurrentSubscription()]);
      setLoading(false);
    };
    init();
  }, [fetchPlans, fetchCurrentSubscription]);

  return {
    plans,
    currentSubscription,
    hasActiveSubscription,
    loading,
    fetchPlans,
    fetchCurrentSubscription,
    checkSubscriptionAccess,
    createSubscription,
  };
};
