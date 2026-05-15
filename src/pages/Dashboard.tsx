import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectOwnerDashboard } from "@/components/dashboard/ProjectOwnerDashboard";
import { InvestorDashboard } from "@/components/dashboard/InvestorDashboard";
import { FunderDashboard } from "@/components/dashboard/FunderDashboard";

type UserType = 'individual' | 'enterprise' | 'investor' | 'funder';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, adminChecked } = useAuth();
  const [userType, setUserType] = useState<UserType>('individual');
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    document.title = "Tableau de bord | MIPROJET";
  }, []);

  useEffect(() => {
    // Only redirect after both loading and admin check are complete
    if (!authLoading && adminChecked) {
      if (!user) {
        navigate('/auth');
      } else if (isAdmin) {
        navigate('/admin');
      }
    }
  }, [authLoading, adminChecked, user, isAdmin, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
      
      if (data?.user_type) {
        setUserType(data.user_type as UserType);
      }
      setProfileLoading(false);
    };

    if (user && adminChecked && !isAdmin) {
      fetchProfile();
    } else if (!user || isAdmin) {
      setProfileLoading(false);
    }
  }, [user, isAdmin, adminChecked]);

  // Show loading while checking auth or admin status
  if (authLoading || !adminChecked || (user && !isAdmin && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || isAdmin) return null;

  const renderDashboardContent = () => {
    switch (userType) {
      case 'investor':
        return <InvestorDashboard />;
      case 'funder':
        return <FunderDashboard />;
      case 'enterprise':
      case 'individual':
      default:
        return <ProjectOwnerDashboard />;
    }
  };

  return (
    <DashboardLayout userType={userType}>
      {renderDashboardContent()}
    </DashboardLayout>
  );
};

export default Dashboard;
