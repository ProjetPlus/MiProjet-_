import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  MessageSquare, Plus, ThumbsUp, Eye, Search, Users,
  TrendingUp, Lightbulb, HelpCircle, Briefcase, Loader2
} from "lucide-react";

const forumCategories = [
  { value: "general", label: "Discussion Générale", icon: MessageSquare },
  { value: "investment", label: "Investissement", icon: TrendingUp },
  { value: "entrepreneurship", label: "Entrepreneuriat", icon: Briefcase },
  { value: "ideas", label: "Idées de Projets", icon: Lightbulb },
  { value: "help", label: "Aide & Questions", icon: HelpCircle },
  { value: "networking", label: "Networking", icon: Users },
];

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author_name: string;
  created_at: string;
  replies_count: number;
  views_count: number;
  likes_count: number;
}

const Forum = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Forum Communautaire | MIPROJET";
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(50);
    
    // Transform messages as forum posts
    const forumPosts: ForumPost[] = (data || []).map(m => ({
      id: m.id,
      title: m.subject || "Sans titre",
      content: m.content,
      category: "general",
      author_name: m.sender_name || "Anonyme",
      created_at: m.created_at,
      replies_count: 0,
      views_count: 0,
      likes_count: 0,
    }));
    setPosts(forumPosts);
    setLoading(false);
  };

  const handleSubmitPost = async () => {
    if (!newPost.title || !newPost.content) {
      toast({ title: "Erreur", description: "Titre et contenu sont obligatoires", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour publier", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("messages").insert([{
      subject: newPost.title,
      content: `[${newPost.category}] ${newPost.content}`,
      sender_id: user.id,
      sender_name: user.email?.split("@")[0],
      sender_email: user.email,
    }]);
    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de publier", variant: "destructive" });
    } else {
      toast({ title: "Publié !", description: "Votre sujet a été créé" });
      setShowNewPost(false);
      setNewPost({ title: "", content: "", category: "general" });
      fetchPosts();
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        {/* Hero */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-primary/10 text-primary">COMMUNAUTÉ</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Forum MIPROJET</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Échangez avec d'autres entrepreneurs, investisseurs et experts. 
            Partagez vos idées, posez vos questions et développez votre réseau.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {forumCategories.map(cat => {
            const Icon = cat.icon;
            return (
              <Card
                key={cat.value}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  filterCategory === cat.value ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setFilterCategory(filterCategory === cat.value ? "all" : cat.value)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">{cat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search & New Post */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un sujet..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => user ? setShowNewPost(true) : toast({ title: "Connexion requise", description: "Connectez-vous pour créer un sujet", variant: "destructive" })} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau sujet
          </Button>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun sujet pour le moment</h3>
              <p className="text-muted-foreground mb-4">Soyez le premier à lancer une discussion !</p>
              <Button onClick={() => setShowNewPost(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Créer un sujet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map(post => (
              <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPost(post)}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{post.author_name}</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-3">Rejoignez la communauté MIPROJET</h3>
            <p className="text-muted-foreground mb-6">
              Connectez-vous avec des entrepreneurs et investisseurs qui partagent votre vision.
            </p>
            {!user && (
              <Button onClick={() => window.location.href = "/auth"} className="gap-2">
                <Users className="h-4 w-4" /> Créer un compte gratuit
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />

      {/* New Post Dialog */}
      <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un nouveau sujet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="Sujet de discussion..." required />
            </div>
            <div>
              <Label>Catégorie *</Label>
              <Select value={newPost.category} onValueChange={v => setNewPost(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {forumCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contenu *</Label>
              <Textarea value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} rows={5} placeholder="Détaillez votre sujet..." required />
            </div>
            <Button onClick={handleSubmitPost} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Publier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Post Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPost.title}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Par {selectedPost.author_name} • {formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true, locale: fr })}
                </p>
              </DialogHeader>
              <div className="prose prose-sm max-w-none mt-4">
                <p className="whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Forum;
