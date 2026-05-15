import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, Search, MoreHorizontal, CheckCircle, Clock, 
  DollarSign, Coins, RefreshCw, Wallet, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string | null;
  referral_code: string;
  status: string;
  commission_amount: number;
  commission_rate: number;
  created_at: string;
  completed_at: string | null;
  paid_at: string | null;
  referrer_name?: string;
  referee_name?: string;
}

const MIP_TO_FCFA = 1230;

export const AdminReferralsManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingPayments: 0,
    totalPaid: 0,
    totalCommissionsMip: 0
  });

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch names for referrers and referees
      const referralsWithNames = await Promise.all(
        data.map(async (ref) => {
          let referrer_name = 'Inconnu';
          let referee_name = 'En attente';

          // Get referrer name
          const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', ref.referrer_id)
            .single();
          
          if (referrerProfile) {
            referrer_name = `${referrerProfile.first_name || ''} ${referrerProfile.last_name || ''}`.trim() || 'Inconnu';
          }

          // Get referee name
          if (ref.referee_id) {
            const { data: refereeProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', ref.referee_id)
              .single();
            
            if (refereeProfile) {
              referee_name = `${refereeProfile.first_name || ''} ${refereeProfile.last_name || ''}`.trim() || 'Utilisateur';
            }
          }

          return { ...ref, referrer_name, referee_name };
        })
      );

      setReferrals(referralsWithNames);

      // Calculate stats
      const totalReferrals = data.length;
      const pendingPayments = data.filter(r => r.status === 'completed').length;
      const totalPaid = data.filter(r => r.status === 'paid').length;
      const totalCommissionsMip = data.reduce((sum, r) => sum + ((r.commission_amount || 0) / MIP_TO_FCFA), 0);

      setStats({
        totalReferrals,
        pendingPayments,
        totalPaid,
        totalCommissionsMip: Math.round(totalCommissionsMip * 100) / 100
      });
    }

    setLoading(false);
  };

  const handleMarkAsPaid = async (referral: Referral) => {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString() 
        })
        .eq('id', referral.id);

      if (error) throw error;

      // Update profile total_commissions
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_commissions')
        .eq('id', referral.referrer_id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ 
            total_commissions: (profile.total_commissions || 0) + (referral.commission_amount || 0) 
          })
          .eq('id', referral.referrer_id);
      }

      // Notify user
      await supabase.from('notifications').insert({
        user_id: referral.referrer_id,
        title: "Commission payée !",
        message: `Votre commission de ${((referral.commission_amount || 0) / MIP_TO_FCFA).toFixed(2)} MiP a été versée.`,
        type: "payment"
      });

      toast({ title: "Succès", description: "Commission marquée comme payée" });
      fetchReferrals();

    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'completed':
        return <Badge className="bg-yellow-500"><DollarSign className="h-3 w-3 mr-1" />À payer</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-500"><CheckCircle className="h-3 w-3 mr-1" />Payé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredReferrals = referrals.filter(r =>
    r.referrer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.referee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestion des Parrainages
          </h2>
          <p className="text-muted-foreground">Gérez les commissions et paiements MiP</p>
        </div>
        <Button variant="outline" onClick={fetchReferrals}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                <p className="text-sm text-muted-foreground">Total parrainages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                <p className="text-sm text-muted-foreground">À payer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPaid}</p>
                <p className="text-sm text-muted-foreground">Payés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Coins className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCommissionsMip} MiP</p>
                <p className="text-sm text-muted-foreground">Total commissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Taux de conversion</p>
              <p className="text-sm text-muted-foreground">1 MiP = {MIP_TO_FCFA.toLocaleString()} FCFA</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {(stats.totalCommissionsMip * MIP_TO_FCFA).toLocaleString()} FCFA
              </p>
              <p className="text-sm text-muted-foreground">Équivalent total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parrain</TableHead>
                <TableHead>Filleul</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Commission MiP</TableHead>
                <TableHead className="text-right">FCFA</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredReferrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun parrainage trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredReferrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">{referral.referrer_name}</TableCell>
                    <TableCell>{referral.referee_name}</TableCell>
                    <TableCell className="font-mono text-sm">{referral.referral_code}</TableCell>
                    <TableCell>
                      {format(new Date(referral.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{getStatusBadge(referral.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {((referral.commission_amount || 0) / MIP_TO_FCFA).toFixed(2)} MiP
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(referral.commission_amount || 0).toLocaleString()} FCFA
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {referral.status === 'completed' && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(referral)}>
                              <Wallet className="h-4 w-4 mr-2" />
                              Marquer comme payé
                            </DropdownMenuItem>
                          )}
                          {referral.status === 'paid' && (
                            <DropdownMenuItem disabled>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Déjà payé
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
