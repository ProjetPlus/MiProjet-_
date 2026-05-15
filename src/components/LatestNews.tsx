import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Newspaper, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, ar, zhCN, es, de } from "date-fns/locale";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  category: string;
  published_at: string | null;
}

export const LatestNews = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchLatestNews = async () => {
      const { data, error } = await supabase
        .from('news')
        .select('id, title, excerpt, content, image_url, category, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        setNews(data);
      }
      setLoading(false);
    };

    fetchLatestNews();
  }, []);

  const handleNewsClick = (id: string) => {
    navigate(`/news/${id}`);
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (news.length === 0) {
    return null;
  }

  // Default placeholder images for news without images
  const defaultImages = [
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop"
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Newspaper className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {t('news.latestTitle')}
              </h2>
              <p className="text-muted-foreground">
                {t('news.latestSubtitle')}
              </p>
            </div>
          </div>
          <Link to="/news">
            <Button variant="outline" className="group">
              {t('news.viewAll')}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* News Cards - Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {news.map((item, index) => {
            const imageUrl = item.image_url || defaultImages[index % defaultImages.length];
            const excerpt = item.excerpt || item.content?.substring(0, 120) + '...';
            
            return (
              <article 
                key={item.id} 
                onClick={() => handleNewsClick(item.id)}
                className="group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 min-w-[280px] max-w-[320px] md:min-w-0 md:max-w-none snap-start flex-shrink-0 md:flex-shrink"
              >
                {/* Gradient Accent - Blue top-left, Green bottom-right */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />
                
                {/* Top accent bar - Blue */}
                <div className="absolute top-0 left-0 w-1/2 h-1 bg-primary z-20" />
                
                {/* Bottom accent bar - Green */}
                <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-secondary z-20" />
                
                {/* Image */}
                <div className="aspect-video overflow-hidden relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultImages[index % defaultImages.length];
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageOff className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  {/* Category Badge */}
                  <Badge 
                    className="absolute top-4 left-4 bg-primary text-primary-foreground shadow-lg"
                  >
                    {item.category}
                  </Badge>
                </div>
                
                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors text-left">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 text-left">
                    {excerpt}
                  </p>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {item.published_at && formatDistanceToNow(new Date(item.published_at), {
                        addSuffix: true,
                        locale: getLocale(),
                      })}
                    </div>
                    <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      {t('common.readMore')}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
