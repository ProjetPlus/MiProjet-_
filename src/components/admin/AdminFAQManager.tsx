import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, HelpCircle, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export const AdminFAQManager = () => {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    sort_order: 0,
    is_active: true,
  });

  const categories = [
    { value: "general", label: "Général" },
    { value: "projects", label: "Projets" },
    { value: "funding", label: "Financement" },
    { value: "account", label: "Compte" },
    { value: "security", label: "Sécurité" },
    { value: "enterprise", label: "Entreprises" },
  ];

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setFaqs(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingFaq) {
      const { error } = await supabase
        .from('faqs')
        .update(formData)
        .eq('id', editingFaq.id);

      if (error) {
        toast({ title: "Erreur", description: "Impossible de modifier la FAQ", variant: "destructive" });
      } else {
        toast({ title: "Succès", description: "FAQ modifiée avec succès" });
        fetchFAQs();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('faqs')
        .insert([formData]);

      if (error) {
        toast({ title: "Erreur", description: "Impossible de créer la FAQ", variant: "destructive" });
      } else {
        toast({ title: "Succès", description: "FAQ créée avec succès" });
        fetchFAQs();
        resetForm();
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('faqs')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      toast({ title: "Succès", description: `FAQ ${!currentStatus ? 'activée' : 'désactivée'}` });
      fetchFAQs();
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette FAQ ?")) return;

    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id);

    if (!error) {
      toast({ title: "Succès", description: "FAQ supprimée" });
      fetchFAQs();
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "general",
      sort_order: 0,
      is_active: true,
    });
    setEditingFaq(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (item: FAQItem) => {
    setEditingFaq(item);
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const filteredFaqs = faqs.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8" />
            Gestion des FAQ
          </h1>
          <p className="text-muted-foreground">Gérez les questions fréquemment posées</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingFaq ? "Modifier la FAQ" : "Nouvelle FAQ"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  placeholder="Comment puis-je..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="answer">Réponse *</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={4}
                  required
                  placeholder="Pour cela, vous devez..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Ordre d'affichage</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingFaq ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune FAQ trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <ArrowUpDown className="h-4 w-4" />
                  </TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaqs.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {item.sort_order}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium line-clamp-1">{item.question}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.answer}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categories.find(c => c.value === item.category)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={item.is_active ? "bg-success text-success-foreground" : "bg-muted"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(item.id, item.is_active)}
                        >
                          {item.is_active ? "🔴" : "🟢"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFaq(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
