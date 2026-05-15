import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, User, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AccessRequest {
  id: string;
  project_id: string;
  user_id: string;
  status: string;
  message: string | null;
  admin_notes: string | null;
  created_at: string;
  project?: {
    title: string;
  };
  profile?: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    user_type: string | null;
  };
}

export const AdminAccessRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('access_requests')
      .select(`
        *,
        project:projects(title),
        profile:profiles(first_name, last_name, company_name, user_type)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data.map(r => ({
        ...r,
        project: r.project as any,
        profile: r.profile as any
      })));
    }
    setLoading(false);
  };

  const handleAction = async (requestId: string, action: 'approved' | 'rejected') => {
    setProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('access_requests')
        .update({
          status: action,
          admin_notes: adminNotes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send notification to user
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase.from('notifications').insert({
          user_id: request.user_id,
          type: 'access_request_response',
          title: action === 'approved' ? "Demande d'accès approuvée" : "Demande d'accès refusée",
          message: action === 'approved' 
            ? `Votre demande d'accès au projet "${request.project?.title}" a été approuvée.`
            : `Votre demande d'accès au projet "${request.project?.title}" a été refusée.${adminNotes ? ` Raison: ${adminNotes}` : ''}`,
          link: action === 'approved' ? `/projects/${request.project_id}` : '/dashboard',
        });
      }

      toast({
        title: "Succès",
        description: `Demande ${action === 'approved' ? 'approuvée' : 'refusée'} avec succès`,
      });

      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/20 text-success"><CheckCircle className="h-3 w-3 mr-1" />Approuvée</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/20 text-destructive"><XCircle className="h-3 w-3 mr-1" />Refusée</Badge>;
      default:
        return <Badge className="bg-warning/20 text-warning"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Demandes d'accès
              {pendingCount > 0 && (
                <Badge variant="destructive">{pendingCount} en attente</Badge>
              )}
            </CardTitle>
            <CardDescription>Gérez les demandes d'accès aux projets</CardDescription>
          </div>
          <Button variant="outline" onClick={fetchRequests}>
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune demande d'accès
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-muted rounded-full">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {request.profile?.first_name} {request.profile?.last_name}
                          </p>
                          {request.profile?.company_name && (
                            <p className="text-xs text-muted-foreground">
                              {request.profile.company_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">
                          {request.project?.title || 'Projet supprimé'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.message ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{request.message}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Aucun message</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAdminNotes(request.admin_notes || "");
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogDescription>
              Examinez et traitez cette demande d'accès
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Demandeur</p>
                  <p className="font-medium">
                    {selectedRequest.profile?.first_name} {selectedRequest.profile?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {selectedRequest.profile?.user_type || 'Non spécifié'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Projet</p>
                  <p className="font-medium">{selectedRequest.project?.title}</p>
                </div>
              </div>

              {selectedRequest.message && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Message du demandeur</p>
                  <p className="bg-muted p-3 rounded-lg text-sm">{selectedRequest.message}</p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-sm mb-1">Notes admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajouter des notes ou une raison de refus..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleAction(selectedRequest.id, 'rejected')}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
                <Button
                  onClick={() => handleAction(selectedRequest.id, 'approved')}
                  disabled={processing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
              </>
            )}
            {selectedRequest?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
