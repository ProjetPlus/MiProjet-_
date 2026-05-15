import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Eye, Search, ArrowRight, Clock, ArrowLeft, ImageOff, Share2, Newspaper, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDistanceToNow, format } from "date-fns";
import { fr, enUS, ar, zhCN, es, de } from "date-fns/locale";
import { SocialSharePopup } from "@/components/SocialSharePopup";
import { ArticleLayout, RelatedItem } from "@/components/article/ArticleLayout";
import { useNewsletterSubscribe } from "@/hooks/useNewsletterSubscribe";
import { useToast } from "@/hooks/use-toast";
import { normalizeArticleHtml } from "@/lib/sanitizeHtml";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  category: string;
  published_at: string | null;
  views_count: number;
  created_at: string;
  is_featured: boolean;
  short_slug?: string | null;
}

const News = () => {
  const { t, language } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showShare, setShowShare] = useState(false);
  const { toast } = useToast();
  const newsletter = useNewsletterSubscribe("news");

  const getLocale = () => {
    switch (language) {
      case 'en': return enUS;
      case 'ar': return ar;
      case 'zh': return zhCN;
      case 'es': return es;
      case 'de': return de;
      default: return fr;
    }
  };

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "general", label: "Général" },
    { value: "events", label: "Événements" },
    { value: "projects", label: "Projets" },
    { value: "partnerships", label: "Partenariats" },
    { value: "training", label: "Formations" },
    { value: "opportunities", label: "Opportunités" },
    { value: "funding", label: "Financement" },
  ];

  const defaultImages = [
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=500&fit=crop",
  ];

  useEffect(() => {
    document.title = "Actualités & Blog | MIPROJET";
    fetchNews();
  }, []);

  useEffect(() => {
    if (id && news.length > 0) {
      const found = news.find(n => n.id === id);
      if (found) {
        setSelectedNews(found);
        document.title = `${found.title} | MIPROJET`;
        supabase.from('news').update({ views_count: (found.views_count || 0) + 1 }).eq('id', id);
      }
    } else if (!id) {
      setSelectedNews(null);
    }
  }, [id, news]);

  const fetchNews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);
    if (!error && data) setNews(data);
    setLoading(false);
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredNews = filteredNews.filter(n => n.is_featured);
  const regularNews = filteredNews.filter(n => !n.is_featured);

  const renderContent = (content: string) => {
    if (content.includes('<p>') || content.includes('<h2>') || content.includes('<strong>')) {
      return (
        <div
          className="prose prose-lg max-w-none
            prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
            prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2
            prose-h3:text-xl
            prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-4
            prose-strong:text-foreground
            prose-li:text-foreground/80
            prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-table:border prose-table:border-border prose-th:bg-muted prose-th:p-3 prose-td:p-3 prose-td:border prose-td:border-border
            prose-img:rounded-xl prose-img:shadow-lg prose-img:my-6
            prose-hr:border-border prose-hr:my-8"
          dangerouslySetInnerHTML={{ __html: normalizeArticleHtml(content) }}
        />
      );
    }
    return (
      <div className="space-y-4 text-foreground/80 leading-relaxed text-base">
        {content.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    );
  };

  // ===== ARTICLE DETAIL =====
  if (selectedNews) {
    const wordCount = selectedNews.content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    const readingMinutes = Math.max(1, Math.round(wordCount / 220));
    const related: RelatedItem[] = news
      .filter((n) => n.id !== selectedNews.id)
      .slice(0, 3)
      .map((n) => ({
        id: n.id,
        title: n.title,
        image: n.image_url,
        date: n.published_at,
        views: n.views_count,
        href: `/news/${n.id}`,
      }));
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 pt-28 md:pt-32">
          <ArticleLayout
            backHref="/news"
            backLabel="Retour aux actualités"
            topTag="Article"
            category={categories.find((c) => c.value === selectedNews.category)?.label || selectedNews.category}
            title={selectedNews.title}
            subtitle={selectedNews.excerpt}
            image={selectedNews.image_url}
            imageAlt={selectedNews.title}
            author={(selectedNews as any).author_name || "MIPROJET"}
            dateISO={selectedNews.published_at}
            readingMinutes={readingMinutes}
            viewsCount={selectedNews.views_count}
            fullReads={Math.round((selectedNews.views_count || 0) * 0.6)}
            sharesCount={0}
            reactionsCount={0}
            contentHtml={selectedNews.content}
            onShare={() => setShowShare(true)}
            relatedTitle="Articles similaires"
            relatedItems={related}
            relatedHref="/news"
            onNewsletterSubmit={(email) => newsletter.subscribe(email)}
          />
        </main>

        <SocialSharePopup
          open={showShare} onClose={() => setShowShare(false)}
          url={`${window.location.origin}/news/${selectedNews.id}`}
          title={selectedNews.title}
          description={selectedNews.excerpt || selectedNews.content.substring(0, 150)}
          imageUrl={selectedNews.image_url || undefined}
          shareType="news" shareId={selectedNews.id}
          shortSlug={selectedNews.short_slug || undefined}
          cta="Lire l'article complet sur MIPROJET"
        />
        <Footer />
      </div>
    );
  }

  // ===== NEWS LIST PAGE =====
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 pt-28 md:pt-32">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary via-primary to-primary/90 py-14 md:py-20 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full translate-y-1/4 -translate-x-1/4" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Newspaper className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">Actualités & Blog</h1>
                <p className="text-primary-foreground/80 text-base md:text-lg mt-1">
                  Restez informé des dernières nouvelles de l'écosystème entrepreneurial africain
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="sticky top-[64px] z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-base"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="text-center py-24">
                <Newspaper className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-lg">Aucune actualité disponible pour le moment</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Featured article - Hero card */}
                {featuredNews.length > 0 && (
                  <div className="mb-8">
                    {featuredNews.slice(0, 1).map((item) => {
                      const img = item.image_url || defaultImages[0];
                      return (
                        <article key={item.id} onClick={() => navigate(`/news/${item.id}`)}
                          className="group relative grid md:grid-cols-2 gap-0 bg-card rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border border-border">
                          <div className="aspect-video md:aspect-auto md:h-full overflow-hidden">
                            <img src={img} alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => { (e.target as HTMLImageElement).src = defaultImages[0]; }} />
                          </div>
                          <div className="p-6 md:p-10 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-4">
                              <Badge className="bg-primary text-primary-foreground">
                                {categories.find(c => c.value === item.category)?.label || item.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                                <TrendingUp className="h-3 w-3 mr-1" />À la une
                              </Badge>
                            </div>
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground group-hover:text-primary transition-colors mb-4 leading-tight text-left">
                              {item.title}
                            </h2>
                            <p className="text-muted-foreground text-base leading-relaxed mb-6 line-clamp-3 text-left">
                              {item.excerpt || item.content.substring(0, 200)}...
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />
                                  {item.published_at && formatDistanceToNow(new Date(item.published_at), { addSuffix: true, locale: getLocale() })}
                                </span>
                                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{item.views_count}</span>
                              </div>
                              <span className="text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                Lire <ArrowRight className="h-4 w-4" />
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* Regular news grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {(featuredNews.length > 0 ? [...featuredNews.slice(1), ...regularNews] : regularNews).map((item, index) => {
                    const imageUrl = item.image_url || defaultImages[index % defaultImages.length];
                    return (
                      <article key={item.id} onClick={() => navigate(`/news/${item.id}`)}
                        className="group relative bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-border flex flex-col">
                        {/* Image */}
                        <div className="aspect-[16/10] overflow-hidden relative">
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => { (e.target as HTMLImageElement).src = defaultImages[index % defaultImages.length]; }} />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <ImageOff className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm text-xs">
                              {categories.find(c => c.value === item.category)?.label || item.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-base text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors text-left leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 text-left flex-1">
                            {item.excerpt || item.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                          </p>
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {item.published_at && formatDistanceToNow(new Date(item.published_at), { addSuffix: true, locale: getLocale() })}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.views_count}</span>
                              <span className="text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                Lire <ArrowRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default News;
