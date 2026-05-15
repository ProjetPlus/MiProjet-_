import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Optimized query options with caching
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  refetchOnWindowFocus: false,
  retry: 2,
};

// Projects queries
export const useProjects = (page = 1, limit = 10, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: ['projects', page, limit, filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*', { count: 'exact' });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.sector) {
        query = query.eq('sector', filters.sector);
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data, count, page, limit };
    },
    ...defaultQueryOptions,
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    ...defaultQueryOptions,
  });
};

// Users/Profiles queries
export const useUsers = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data, count, page, limit };
    },
    ...defaultQueryOptions,
  });
};

// Payments queries
export const usePayments = (page = 1, limit = 20, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: ['payments', page, limit, filters],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*, projects(title)', { count: 'exact' });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data, count, page, limit };
    },
    ...defaultQueryOptions,
  });
};

// Service Requests queries
export const useServiceRequests = (page = 1, limit = 20, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: ['serviceRequests', page, limit, filters],
    queryFn: async () => {
      let query = supabase
        .from('service_requests')
        .select('*', { count: 'exact' });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.service_type) {
        query = query.eq('service_type', filters.service_type);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data, count, page, limit };
    },
    ...defaultQueryOptions,
  });
};

// News queries
export const useNews = (page = 1, limit = 25, includeArchived = false) => {
  return useQuery({
    queryKey: ['news', page, limit, includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('news')
        .select('*', { count: 'exact' })
        .eq('status', 'published');

      if (!includeArchived) {
        query = query.is('archived_at', null);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('published_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data, count, page, limit };
    },
    ...defaultQueryOptions,
  });
};

// FAQs queries
export const useFAQs = (category?: string) => {
  return useQuery({
    queryKey: ['faqs', category],
    queryFn: async () => {
      let query = supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    ...defaultQueryOptions,
  });
};

// Invoices queries
export const useInvoices = (page = 1, limit = 20, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: ['invoices', page, limit, filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*', { count: 'exact' });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data, count, page, limit };
    },
    ...defaultQueryOptions,
  });
};

// Notifications queries
export const useNotificationsQuery = (userId?: string) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute for notifications
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// Stats queries for dashboard
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const [projectsResult, usersResult, paymentsResult, requestsResult] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }),
      ]);

      const totalRevenue = paymentsResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      return {
        totalProjects: projectsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalRevenue,
        totalRequests: requestsResult.count || 0,
      };
    },
    ...defaultQueryOptions,
  });
};

// Mutation hooks
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { data: result, error } = await supabase
        .from('projects')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
};

export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: {
      user_id: string;
      title: string;
      message?: string;
      type?: string;
      link?: string;
    }) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', data.user_id] });
    },
  });
};
