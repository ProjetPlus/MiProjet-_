import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MoreHorizontal, Search, Eye, Edit, Trash2, CheckCircle, XCircle, 
  Plus, RefreshCw, FolderOpen, Globe, Upload, Loader2, Download
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

const sectors = [
  "Agriculture & Agro-industrie", "Santé", "Éducation", "Digital & Numérique",
  "Énergie", "Immobilier", "Logistique & Transport", "Industrie",
  "Commerce", "Services", "Environnement", "Tourisme", "Autre"
];

interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  sector: string | null;
  status: string;
  funding_goal: number | null;
  funds_raised: number;
  fonds_disponibles: string | null;
  risk_score: string | null;
  created_at: string;
  country: string | null;
  city: string | null;
  owner_id: string;
  image_url: string | null;
  documents: any;
}

export const AdminProjectsTable = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const [createForm, setCreateForm] = useState({
    title: "", description: "", category: "", sector: "", status: "published",
    funding_goal: 0, risk_score: "", country: "Côte d'Ivoire", city: "",
    fonds_disponibles: "", image_url: "",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    status: "",
    funding_goal: 0,
    risk_score: ""
  });
  const { toast } = useToast();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    // Real-time subscription
    const channel = supabase
      .channel('admin-projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterStatus]);

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;
      
      // Notify project owner
      const project = projects.find(p => p.id === projectId);
      if (project) {
        await supabase.from('notifications').insert({
          user_id: project.owner_id,
          title: `Projet ${status === 'published' ? 'publié' : status === 'rejected' ? 'rejeté' : 'mis à jour'}`,
          message: `Votre projet "${project.title}" a été ${status === 'published' ? 'publié sur la plateforme' : status === 'rejected' ? 'rejeté' : 'mis à jour'}.`,
          type: 'project_update',
          link: '/dashboard'
        });
      }
      
      toast({ title: "Succès", description: `Statut mis à jour: ${status}` });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.")) return;

    try {
      // Delete related records first
      await supabase.from('project_evaluations').delete().eq('project_id', projectId);
      await supabase.from('access_requests').delete().eq('project_id', projectId);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      toast({ title: "Succès", description: "Projet supprimé avec succès" });
      fetchProjects();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setEditForm({
      title: project.title,
      description: project.description || "",
      category: project.category || "",
      status: project.status,
      funding_goal: project.funding_goal || 0,
      risk_score: project.risk_score || ""
    });
    setShowEditDialog(true);
  };

  const handleCreateProject = async () => {
    if (!createForm.title || !user) return;
    try {
      const { error } = await supabase.from('projects').insert([{
        title: createForm.title,
        description: createForm.description,
        category: createForm.category,
        sector: createForm.sector,
        status: createForm.status,
        funding_goal: createForm.funding_goal,
        risk_score: createForm.risk_score || null,
        country: createForm.country,
        city: createForm.city,
        fonds_disponibles: createForm.fonds_disponibles || null,
        image_url: createForm.image_url || null,
        owner_id: user.id,
      }]);
      if (error) throw error;
      toast({ title: "Succès", description: "Projet créé avec succès" });
      setShowCreateDialog(false);
      setCreateForm({ title: "", description: "", category: "", sector: "", status: "published", funding_goal: 0, risk_score: "", country: "Côte d'Ivoire", city: "", fonds_disponibles: "", image_url: "" });
      fetchProjects();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleUploadDocument = async (file: File) => {
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('documents').upload(`projects/${fileName}`, file);
    setUploading(false);
    if (error) {
      toast({ title: "Erreur upload", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(`projects/${fileName}`);
    return urlData.publicUrl;
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update(editForm)
        .eq('id', selectedProject.id);

      if (error) throw error;
      
      toast({ title: "Succès", description: "Projet mis à jour" });
      setShowEditDialog(false);
      fetchProjects();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      pending: { variant: "outline", label: "En attente" },
      in_structuring: { variant: "outline", label: "En structuration" },
      published: { variant: "default", label: "Publié" },
      validated: { variant: "default", label: "Validé" },
      funded: { variant: "default", label: "Financé" },
      rejected: { variant: "destructive", label: "Rejeté" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRiskBadge = (risk: string | null) => {
    if (!risk) return <Badge variant="outline">N/A</Badge>;
    const colors: Record<string, string> = {
      A: "bg-success text-success-foreground",
      B: "bg-warning text-warning-foreground",
      C: "bg-destructive text-destructive-foreground",
    };
    return <Badge className={colors[risk] || ""}>{risk}</Badge>;
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sector?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            Gestion des Projets
          </h2>
          <p className="text-muted-foreground">Gérez tous les projets de la plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter un projet
          </Button>
          <Button onClick={fetchProjects} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_structuring">En structuration</SelectItem>
                <SelectItem value="published">Publiés</SelectItem>
                <SelectItem value="validated">Validés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Projets ({filteredProjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Objectif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{project.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.city && project.country ? `${project.city}, ${project.country}` : project.country || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.category || project.sector || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>{getRiskBadge(project.risk_score)}</TableCell>
                    <TableCell className="text-right">
                      {project.funding_goal?.toLocaleString() || 0} FCFA
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedProject(project); setShowViewDialog(true); }}>
                            <Eye className="mr-2 h-4 w-4" /> Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(project)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateProjectStatus(project.id, 'published')}>
                            <Globe className="mr-2 h-4 w-4" /> Publier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateProjectStatus(project.id, 'validated')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Valider
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateProjectStatus(project.id, 'rejected')}>
                            <XCircle className="mr-2 h-4 w-4" /> Rejeter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteProject(project.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!loading && filteredProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun projet trouvé
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog - Enhanced Responsive */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold">{selectedProject?.title}</DialogTitle>
            <DialogDescription>Détails complets du projet</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              {/* Status & Score Section */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">Statut & Évaluation</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Statut actuel</Label>
                    <div className="mt-1">{getStatusBadge(selectedProject.status)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Score de risque</Label>
                    <div className="mt-1">{getRiskBadge(selectedProject.risk_score)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Fonds disponibles</Label>
                    <p className="font-medium text-primary">{selectedProject.fonds_disponibles || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>

              {/* Classification Section */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">Classification</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Catégorie</Label>
                    <p className="font-medium">{selectedProject.category || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Secteur</Label>
                    <p className="font-medium">{selectedProject.sector || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Objectif de financement</Label>
                    <p className="font-medium text-lg">{selectedProject.funding_goal?.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">Localisation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Pays</Label>
                    <p className="font-medium">{selectedProject.country || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Ville</Label>
                    <p className="font-medium">{selectedProject.city || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">Description du projet</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedProject.description || 'Aucune description fournie'}</p>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-4 border-t">
                <span>ID: <code className="bg-muted px-1 rounded">{selectedProject.id.slice(0, 8)}...</code></span>
                <span>Créé le: {new Date(selectedProject.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
            <DialogDescription>Modifiez les informations du projet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input 
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input 
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Objectif (FCFA)</Label>
                <Input 
                  type="number"
                  value={editForm.funding_goal}
                  onChange={(e) => setEditForm({ ...editForm, funding_goal: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select 
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_structuring">En structuration</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="validated">Validé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Score de risque</Label>
                <Select 
                  value={editForm.risk_score}
                  onValueChange={(v) => setEditForm({ ...editForm, risk_score: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Excellent</SelectItem>
                    <SelectItem value="B">B - Bon</SelectItem>
                    <SelectItem value="C">C - À surveiller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateProject}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau projet</DialogTitle>
            <DialogDescription>Créez un projet à destination des investisseurs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre du projet *</Label>
              <Input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} placeholder="Ex: Ferme avicole moderne" required />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} rows={4} placeholder="Description détaillée du projet..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Secteur *</Label>
                <Select value={createForm.sector} onValueChange={v => setCreateForm({ ...createForm, sector: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })} placeholder="Ex: Agro-industrie" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Objectif de financement (FCFA)</Label>
                <Input type="number" value={createForm.funding_goal} onChange={e => setCreateForm({ ...createForm, funding_goal: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Score de risque</Label>
                <Select value={createForm.risk_score} onValueChange={v => setCreateForm({ ...createForm, risk_score: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Excellent</SelectItem>
                    <SelectItem value="B">B - Bon</SelectItem>
                    <SelectItem value="C">C - À surveiller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input value={createForm.country} onChange={e => setCreateForm({ ...createForm, country: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fonds disponibles</Label>
                <Select value={createForm.fonds_disponibles} onValueChange={v => setCreateForm({ ...createForm, fonds_disponibles: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Oui</SelectItem>
                    <SelectItem value="non">Non</SelectItem>
                    <SelectItem value="partiel">Partiellement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={createForm.status} onValueChange={v => setCreateForm({ ...createForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image du projet (URL)</Label>
              <Input value={createForm.image_url} onChange={e => setCreateForm({ ...createForm, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Document PDF du projet</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await handleUploadDocument(file);
                    if (url) {
                      toast({ title: "Document uploadé", description: "Le document a été téléchargé avec succès" });
                    }
                  }
                }}
              />
              {uploading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Upload en cours...</div>}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
              <Button onClick={handleCreateProject} disabled={!createForm.title}>
                <Plus className="h-4 w-4 mr-2" /> Créer le projet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
