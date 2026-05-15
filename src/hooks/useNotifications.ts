import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  metadata?: Record<string, any>;
}

export const useNotifications = () => {
  const createNotification = async ({
    userId,
    title,
    message,
    type = 'info',
    link,
    metadata = {},
  }: CreateNotificationParams) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        link,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  };

  const createAdminNotification = async ({
    title,
    message,
    type = 'info',
    link,
    metadata = {},
  }: Omit<CreateNotificationParams, 'userId'>) => {
    // Get all admin users
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles?.length) return [];

    // Create notification for each admin
    const notifications = adminRoles.map(role => ({
      user_id: role.user_id,
      title,
      message,
      type,
      link,
      metadata,
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('Error creating admin notifications:', error);
      return [];
    }

    return data;
  };

  return {
    createNotification,
    createAdminNotification,
  };
};
