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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, Copy, Gift, Wallet, TrendingUp, 
  CheckCircle, Clock, DollarSign, Share2, Coins
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Referral {
  id: string;
  referral_code: string;
  referee_id: string | null;
  status: string;
  commission_amount: number;
  commission_rate: number;
  created_at: string;
  completed_at: string | null;
  paid_at: string | null;
  referee_name?: string;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  totalCommissionsMip: number;
  pendingCommissionsMip: number;
  paidCommissionsMip: number;
}

const MIP_TO_FCFA = 1230;
const COMMISSION_RATE = 6.5;

export const ReferralTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    totalCommissionsMip: 0,
    pendingCommissionsMip: 0,
    paidCommissionsMip: 0
  });

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;
    setLoading(true);

    // Get user's referral code from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, total_referrals, total_commissions')
      .eq('id', user.id)
      .single();

    if (profile) {
      setReferralCode(profile.referral_code);
    }

    // Fetch all referrals for this user
    const { data: referralsData } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (referralsData) {
      // Get referee names
      const referralsWithNames = await Promise.all(
        referralsData.map(async (ref) => {
          if (ref.referee_id) {
            const { data: refProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', ref.referee_id)
              .single();
            
            return {
              ...ref,
              referee_name: refProfile ? `${refProfile.first_name || ''} ${refProfile.last_name || ''}`.trim() : 'Utilisateur'
            };
          }
          return { ...ref, referee_name: 'En attente' };
        })
      );

      setReferrals(referralsWithNames);

      // Calculate stats
      const totalReferrals = referralsData.length;
      const completedReferrals = referralsData.filter(r => r.status === 'completed' || r.status === 'paid').length;
      
      let totalCommissions = 0;
      let pendingCommissions = 0;
      let paidCommissions = 0;

      referralsData.forEach(r => {
        const commissionMip = (r.commission_amount || 0) / MIP_TO_FCFA;
        totalCommissions += commissionMip;
        if (r.status === 'completed') pendingCommissions += commissionMip;
        if (r.status === 'paid') paidCommissions += commissionMip;
      });

      setStats({
        totalReferrals,
        completedReferrals,
        totalCommissionsMip: Math.round(totalCommissions * 100) / 100,
        pendingCommissionsMip: Math.round(pendingCommissions * 100) / 100,
        paidCommissionsMip: Math.round(paidCommissions * 100) / 100
      });
    }

    setLoading(false);
  };

  const copyReferralLink = () => {
    if (referralCode) {
      const link = `${window.location.origin}/auth?ref=${referralCode}`;
      navigator.clipboard.writeText(link);
      toast({ title: "Copié !", description: "Lien de parrainage copié dans le presse-papiers" });
    }
  };

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast({ title: "Copié !", description: "Code parrain copié" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'completed':
        return <Badge className="bg-yellow-500"><Gift className="h-3 w-3 mr-1" />À payer</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-500"><CheckCircle className="h-3 w-3 mr-1" />Payé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Programme de Parrainage
        </h2>
        <p className="text-muted-foreground">
          Parrainez des utilisateurs et gagnez {COMMISSION_RATE}% de commission en MiP
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground mb-1">Votre code parrain</p>
              <p className="text-3xl font-bold text-primary">{referralCode || 'Non généré'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyReferralCode}>
                <Copy className="h-4 w-4 mr-2" />
                Copier le code
              </Button>
              <Button onClick={copyReferralLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Copier le lien
              </Button>
            </div>
          </div>
          <div className="mt-4 p-3 bg-card/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Taux de conversion :</strong> 1 MiP = {MIP_TO_FCFA.toLocaleString()} FCFA | 
              <strong> Commission :</strong> {COMMISSION_RATE}% sur chaque paiement effectué par vos filleuls
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                <p className="text-sm text-muted-foreground">Parrainages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <Coins className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCommissionsMip.toFixed(2)} MiP</p>
                <p className="text-sm text-muted-foreground">Gains totaux</p>
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
                <p className="text-2xl font-bold">{stats.pendingCommissionsMip.toFixed(2)} MiP</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Wallet className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.paidCommissionsMip.toFixed(2)} MiP</p>
                <p className="text-sm text-muted-foreground">Payés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equivalence FCFA */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Équivalence en FCFA</p>
              <p className="text-sm text-muted-foreground">Basé sur le taux 1 MiP = {MIP_TO_FCFA} FCFA</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {(stats.totalCommissionsMip * MIP_TO_FCFA).toLocaleString()} FCFA
              </p>
              <p className="text-sm text-muted-foreground">Total des gains</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des parrainages</CardTitle>
          <CardDescription>Suivez vos parrainages et commissions</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun parrainage pour le moment</p>
              <p className="text-sm mt-2">Partagez votre lien pour commencer à gagner !</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filleul</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Commission (MiP)</TableHead>
                  <TableHead className="text-right">Équivalent FCFA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">
                      {referral.referee_name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(referral.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(referral.status)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {((referral.commission_amount || 0) / MIP_TO_FCFA).toFixed(2)} MiP
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(referral.commission_amount || 0).toLocaleString()} FCFA
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-medium mb-1">Partagez votre lien</h4>
              <p className="text-sm text-muted-foreground">
                Invitez vos contacts avec votre lien unique de parrainage
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-medium mb-1">Ils s'inscrivent</h4>
              <p className="text-sm text-muted-foreground">
                Vos filleuls s'inscrivent et soumettent leurs projets
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-medium mb-1">Gagnez {COMMISSION_RATE}%</h4>
              <p className="text-sm text-muted-foreground">
                Recevez {COMMISSION_RATE}% de commission sur leurs paiements en MiP
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
