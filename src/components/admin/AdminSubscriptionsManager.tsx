import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Edit, Trash2, Search, Crown, Users, 
  CreditCard, Loader2, TrendingUp, Check, X, UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  payment_method: string | null;
  created_at: string;
  profiles?: { first_name: string | null; last_name: string | null; phone: string | null; email: string | null };
  subscription_plans?: SubscriptionPlan;
}

export const AdminSubscriptionsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Assign subscription form
  const [assignEmail, setAssignEmail] = useState("");
  const [assignPlanId, setAssignPlanId] = useState("");
  const [assignDays, setAssignDays] = useState(30);
  const [assigning, setAssigning] = useState(false);

  const [formData, setFormData] = useState({
    name: "", description: "", duration_type: "monthly", duration_days: 30,
    price: 0, currency: "XOF", features: "", is_active: true, sort_order: 0,
  });

  const [stats, setStats] = useState({ totalSubscriptions: 0, activeSubscriptions: 0, revenue: 0 });

  useEffect(() => { fetchPlans(); fetchSubscriptions(); }, [filterStatus]);

  const fetchPlans = async () => {
    const { data } = await supabase.from('subscription_plans').select('*').order('sort_order', { ascending: true });
    if (data) setPlans(data.map(p => ({ ...p, features: Array.isArray(p.features) ? (p.features as string[]) : [] })));
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    let query = supabase.from('user_subscriptions')
      .select(`*, profiles:user_id(first_name, last_name, phone, email), subscription_plans:plan_id(*)`)
      .order('created_at', { ascending: false });
    if (filterStatus !== "all") query = query.eq('status', filterStatus);
    const { data } = await query;
    if (data) {
      setSubscriptions(data as any);
      const active = data.filter((s: any) => s.status === 'active').length;
      const revenue = data.filter((s: any) => s.status === 'active' || s.status === 'expired')
        .reduce((sum: number, s: any) => sum + (s.subscription_plans?.price || 0), 0);
      setStats({ totalSubscriptions: data.length, activeSubscriptions: active, revenue });
    }
    setLoading(false);
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const planData = { ...formData, features: formData.features.split('\n').filter(f => f.trim()) };
    if (editingPlan) {
      const { error } = await supabase.from('subscription_plans').update(planData).eq('id', editingPlan.id);
      if (error) toast({ title: "Erreur", variant: "destructive" });
      else { toast({ title: "Plan modifié" }); fetchPlans(); resetForm(); }
    } else {
      const { error } = await supabase.from('subscription_plans').insert([planData]);
      if (error) toast({ title: "Erreur", variant: "destructive" });
      else { toast({ title: "Plan créé" }); fetchPlans(); resetForm(); }
    }
  };

  const cancelSubscription = async (sub: UserSubscription) => {
    if (!confirm(`Résilier l'abonnement de ${(sub.profiles as any)?.first_name || 'cet utilisateur'} ?`)) return;
    const { error } = await supabase.from('user_subscriptions').update({ 
      status: 'cancelled', expires_at: new Date().toISOString() 
    }).eq('id', sub.id);
    if (!error) { toast({ title: "Abonnement résilié" }); fetchSubscriptions(); }
  };

  const activateSubscription = async (sub: UserSubscription) => {
    const plan = sub.subscription_plans as any;
    const days = plan?.duration_days || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    const { error } = await supabase.from('user_subscriptions').update({
      status: 'active', started_at: new Date().toISOString(), expires_at: expiresAt.toISOString()
    }).eq('id', sub.id);
    if (!error) { toast({ title: "Abonnement activé" }); fetchSubscriptions(); }
  };

  const assignSubscription = async () => {
    if (!assignEmail || !assignPlanId) {
      toast({ title: "Remplissez tous les champs", variant: "destructive" }); return;
    }
    setAssigning(true);
    try {
      // Find user by email
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', assignEmail.trim()).single();
      if (!profile) { toast({ title: "Utilisateur introuvable", description: "Aucun compte avec cet email", variant: "destructive" }); return; }
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + assignDays);
      
      const { error } = await supabase.from('user_subscriptions').insert([{
        user_id: profile.id, plan_id: assignPlanId, status: 'active',
        started_at: new Date().toISOString(), expires_at: expiresAt.toISOString(),
        payment_method: 'admin_assigned'
      }]);
      if (error) throw error;
      toast({ title: "Abonnement assigné avec succès" });
      setIsAssignDialogOpen(false);
      setAssignEmail(""); setAssignPlanId(""); setAssignDays(30);
      fetchSubscriptions();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setAssigning(false); }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Supprimer ce plan ?")) return;
    const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
    if (!error) { toast({ title: "Plan supprimé" }); fetchPlans(); }
    else toast({ title: "Erreur", description: "Plan utilisé par des abonnements", variant: "destructive" });
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", duration_type: "monthly", duration_days: 30, price: 0, currency: "XOF", features: "", is_active: true, sort_order: 0 });
    setEditingPlan(null); setIsDialogOpen(false);
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({ name: plan.name, description: plan.description || "", duration_type: plan.duration_type, duration_days: plan.duration_days, price: plan.price, currency: plan.currency, features: plan.features.join('\n'), is_active: plan.is_active, sort_order: plan.sort_order });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-success text-success-foreground">Actif</Badge>;
      case 'expired': return <Badge variant="secondary">Expiré</Badge>;
      case 'cancelled': return <Badge variant="destructive">Annulé</Badge>;
      default: return <Badge variant="outline">En attente</Badge>;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const profile = sub.profiles as any;
    const name = `${profile?.first_name || ''} ${profile?.last_name || ''} ${profile?.email || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Crown className="h-7 w-7" />Gestion des Abonnements
          </h1>
          <p className="text-muted-foreground">Gérez les plans, résiliez ou assignez des abonnements</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full"><Users className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{stats.totalSubscriptions}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-full"><Crown className="h-5 w-5 text-success" /></div>
          <div><p className="text-2xl font-bold">{stats.activeSubscriptions}</p><p className="text-xs text-muted-foreground">Actifs</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-full"><TrendingUp className="h-5 w-5 text-accent" /></div>
          <div><p className="text-2xl font-bold">{stats.revenue.toLocaleString()} FCFA</p><p className="text-xs text-muted-foreground">Revenus</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="plans">Plans tarifaires</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          {/* Assign subscription button */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un abonné..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 whitespace-nowrap"><UserPlus className="h-4 w-4" />Assigner abonnement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assigner un abonnement</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Email de l'utilisateur *</Label>
                    <Input value={assignEmail} onChange={(e) => setAssignEmail(e.target.value)} placeholder="email@exemple.com" type="email" />
                  </div>
                  <div className="space-y-2">
                    <Label>Plan *</Label>
                    <Select value={assignPlanId} onValueChange={setAssignPlanId}>
                      <SelectTrigger><SelectValue placeholder="Sélectionnez un plan" /></SelectTrigger>
                      <SelectContent>
                        {plans.filter(p => p.is_active).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString()} FCFA</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Durée (jours)</Label>
                    <Input type="number" value={assignDays} onChange={(e) => setAssignDays(parseInt(e.target.value) || 30)} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Annuler</Button>
                    <Button onClick={assignSubscription} disabled={assigning}>
                      {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      Assigner
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Abonné</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Début</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => {
                        const profile = sub.profiles as any;
                        const plan = sub.subscription_plans as any;
                        return (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <div className="text-left">
                                <p className="font-medium">{profile?.first_name || ''} {profile?.last_name || 'Utilisateur'}</p>
                                <p className="text-xs text-muted-foreground">{profile?.email || ''}</p>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{plan?.name || '?'}</Badge></TableCell>
                            <TableCell>{getStatusBadge(sub.status)}</TableCell>
                            <TableCell className="text-sm">{sub.started_at ? format(new Date(sub.started_at), 'dd/MM/yy') : '-'}</TableCell>
                            <TableCell className="text-sm">{sub.expires_at ? format(new Date(sub.expires_at), 'dd/MM/yy') : '-'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{sub.payment_method || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {(sub.status === 'pending' || sub.status === 'cancelled' || sub.status === 'expired') && (
                                  <Button size="sm" variant="outline" onClick={() => activateSubscription(sub)} title="Activer">
                                    <Check className="h-4 w-4 text-success" />
                                  </Button>
                                )}
                                {sub.status === 'active' && (
                                  <Button size="sm" variant="outline" onClick={() => cancelSubscription(sub)} title="Résilier">
                                    <X className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredSubscriptions.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun abonnement trouvé</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Nouveau plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingPlan ? "Modifier le plan" : "Nouveau plan"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmitPlan} className="space-y-4">
                  <div className="space-y-2"><Label>Nom *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Type de durée</Label>
                      <Select value={formData.duration_type} onValueChange={(v) => setFormData({ ...formData, duration_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuel</SelectItem>
                          <SelectItem value="quarterly">Trimestriel</SelectItem>
                          <SelectItem value="semiannual">Semestriel</SelectItem>
                          <SelectItem value="annual">Annuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Durée (jours)</Label><Input type="number" value={formData.duration_days} onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Prix (FCFA)</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} required /></div>
                    <div className="space-y-2"><Label>Ordre</Label><Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Avantages (un par ligne)</Label>
                    <textarea className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} placeholder="Accès aux opportunités&#10;Formations premium&#10;Support dédié" />
                  </div>
                  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={resetForm}>Annuler</Button><Button type="submit">{editingPlan ? "Modifier" : "Créer"}</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={!plan.is_active ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-left">{plan.name}</CardTitle>
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>{plan.is_active ? 'Actif' : 'Inactif'}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-left">{plan.price.toLocaleString()} FCFA</p>
                  <p className="text-sm text-muted-foreground text-left">{plan.duration_days} jours</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm mb-4 text-left">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-success flex-shrink-0" />{f}</li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(plan)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => deletePlan(plan.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
