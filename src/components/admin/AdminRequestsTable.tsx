import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Eye, CheckCircle, XCircle, Clock, 
  FileText, Building2, MoreHorizontal,
  Download, Mail, Phone
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ServiceRequest {
  id: string;
  service_type: string;
  company_name: string | null;
  sector: string | null;
  status: string | null;
  funding_needed: number | null;
  created_at: string;
  user_id: string;
  description: string | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
  };
}

const SERVICE_TYPES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  structuring: { label: 'Structuration', icon: <FileText className="h-4 w-4" />, color: 'bg-primary/10 text-primary' },
  enterprise: { label: 'Accompagnement', icon: <Building2 className="h-4 w-4" />, color: 'bg-info/10 text-info' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  reviewing: { label: 'En cours', variant: 'default' },
  approved: { label: 'Approuvé', variant: 'default' },
  paid: { label: 'Payé', variant: 'default' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
  completed: { label: 'Terminé', variant: 'outline' },
};

export const AdminRequestsTable = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately for each unique user
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, whatsapp')
        .in('id', userIds);
      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

      const enriched = (data || []).map((r: any) => ({
        ...r,
        profiles: profilesMap.get(r.user_id) || null,
      }));

      setRequests(enriched as ServiceRequest[]);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));

      toast({
        title: "Statut mis à jour",
        description: `La demande a été marquée comme "${STATUS_CONFIG[newStatus]?.label || newStatus}"`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      (req.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.profiles?.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.profiles?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || !statusFilter || req.status === statusFilter;
    const matchesType = typeFilter === "all" || !typeFilter || req.service_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved' || r.status === 'completed').length,
    budget: requests.reduce((sum, r) => sum + (r.funding_needed || 0), 0)
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total demandes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approuvées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{(stats.budget / 1000000).toFixed(1)}M</div>
            <p className="text-sm text-muted-foreground">FCFA budget total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Type de service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allall">Tous les types</SelectItem>
                <SelectItem value="structuring">Structuration</SelectItem>
                <SelectItem value="enterprise">Accompagnement</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="reviewing">En cours</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Projet/Entreprise</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune demande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => {
                    const typeConfig = SERVICE_TYPES[request.service_type] || SERVICE_TYPES.structuring;
                    const statusConfig = STATUS_CONFIG[request.status || 'pending'];
                    
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="text-sm">
                          {format(new Date(request.created_at), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {request.profiles?.first_name} {request.profiles?.last_name}
                          </div>
                          {request.profiles?.email && (
                            <div className="text-xs text-muted-foreground">{request.profiles.email}</div>
                          )}
                          {(request.profiles?.phone || request.profiles?.whatsapp) && (
                            <div className="text-xs text-muted-foreground">{request.profiles?.phone || request.profiles?.whatsapp}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {request.company_name || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${typeConfig.color}`}>
                            {typeConfig.icon}
                            {typeConfig.label}
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.funding_needed 
                            ? `${(request.funding_needed / 1000000).toFixed(1)}M FCFA`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {request.profiles?.email && (
                              <Button variant="ghost" size="icon" asChild title="Email">
                                <a href={`mailto:${request.profiles.email}`}><Mail className="h-4 w-4" /></a>
                              </Button>
                            )}
                            {(request.profiles?.whatsapp || request.profiles?.phone) && (
                              <Button variant="ghost" size="icon" asChild title="WhatsApp">
                                <a href={`https://wa.me/${(request.profiles?.whatsapp || request.profiles?.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                  <Phone className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === 'pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => updateStatus(request.id, 'approved')}
                                  className="text-success hover:text-success"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => updateStatus(request.id, 'rejected')}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogDescription>
              {selectedRequest?.company_name || 'Demande de service'}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type de service</p>
                  <p className="font-medium">{SERVICE_TYPES[selectedRequest.service_type]?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge variant={STATUS_CONFIG[selectedRequest.status || 'pending'].variant}>
                    {STATUS_CONFIG[selectedRequest.status || 'pending'].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Secteur</p>
                  <p className="font-medium">{selectedRequest.sector || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget estimé</p>
                  <p className="font-medium">
                    {selectedRequest.funding_needed 
                      ? `${selectedRequest.funding_needed.toLocaleString()} FCFA`
                      : '-'
                    }
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {selectedRequest.description || 'Aucune description'}
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => updateStatus(selectedRequest.id, 'reviewing')}
                  disabled={selectedRequest.status === 'reviewing'}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Marquer en cours
                </Button>
                <Button 
                  onClick={() => updateStatus(selectedRequest.id, 'approved')}
                  disabled={selectedRequest.status === 'approved'}
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approuver
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => updateStatus(selectedRequest.id, 'rejected')}
                  disabled={selectedRequest.status === 'rejected'}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
