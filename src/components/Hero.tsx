import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Newspaper, Target, Sparkles, TrendingUp, Users, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import heroFallback from "@/assets/hero-collaboration.jpg";

type Slide = {
  id: string;
  type: "news" | "opportunity";
  title: string;
  excerpt: string;
  image: string;
  href: string;
  badge: string;
};

export const Hero = () => {
  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const isPremium = hasActiveSubscription;
  const [slides, setSlides] = useState<Slide[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", duration: 28 },
    [Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [selectedIdx, setSelectedIdx] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIdx(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    const load = async () => {
      const [{ data: news }, { data: opps }] = await Promise.all([
        supabase
          .from("news")
          .select("id, title, excerpt, image_url, short_slug")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(4),
        supabase
          .from("opportunities")
          .select("id, title, description, image_url, short_slug, is_premium")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      const newsSlides: Slide[] = (news || []).map((n: any) => ({
        id: `n-${n.id}`,
        type: "news",
        title: n.title,
        excerpt: n.excerpt || "Découvrez les dernières actualités MIPROJET.",
        image: n.image_url || heroFallback,
        href: `/news/${n.short_slug || n.id}`,
        badge: "Actualité",
      }));

      // Visibility filter (premium-only opportunities require active subscription)
      const oppFiltered = (opps || []).filter((o: any) => {
        if (!o.is_premium) return true;
        return !!user && isPremium;
      });

      const oppSlides: Slide[] = oppFiltered.slice(0, 4).map((o: any) => ({
        id: `o-${o.id}`,
        type: "opportunity",
        title: o.title,
        excerpt: o.description?.slice(0, 180) || "Nouvelle opportunité de financement disponible.",
        image: o.image_url || heroFallback,
        href: `/opportunities/${o.short_slug || o.id}`,
        badge: o.is_premium ? "Opportunité Premium" : "Opportunité",
      }));

      // Interleave for variety
      const merged: Slide[] = [];
      const max = Math.max(newsSlides.length, oppSlides.length);
      for (let i = 0; i < max; i++) {
        if (newsSlides[i]) merged.push(newsSlides[i]);
        if (oppSlides[i]) merged.push(oppSlides[i]);
      }

      // Always provide at least one fallback hero card
      if (merged.length === 0) {
        merged.push({
          id: "fallback-1",
          type: "news",
          title: "Structurez, financez et incubez vos projets en Afrique",
          excerpt:
            "MIPROJET accompagne les entrepreneurs et investisseurs panafricains avec des outils professionnels.",
          image: heroFallback,
          href: "/projects",
          badge: "MIPROJET",
        });
      }

      setSlides(merged);
    };
    load();
  }, [user, isPremium]);

  const stats = [
    { icon: TrendingUp, value: "105+", label: "Projets structurés" },
    { icon: Users, value: "65+", label: "Membres actifs" },
    { icon: Shield, value: "5", label: "Pays couverts" },
  ];

  return (
    <section
      className="relative pt-[108px] md:pt-[132px] pb-12 overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-secondary/20 blur-3xl animate-blob" />
        <div
          className="absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-primary-glow/30 blur-3xl animate-blob"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="container-luxe relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left intro */}
          <div className="lg:col-span-5 text-white space-y-5 reveal-up">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-secondary-glow" /> Plateforme panafricaine
            </span>
            <h1 className="text-display text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05]">
              Structurez,{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-secondary)" }}
              >
                financez
              </span>{" "}
              et incubez vos projets
            </h1>
            <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-xl">
              MIPROJET accompagne porteurs, investisseurs et bailleurs en Afrique avec des outils
              professionnels — structuration, financement et incubation.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
              <Link to="/solutions/miprojet-go" className="w-full sm:w-auto">
                <Button size="lg" className="w-full font-bold text-white shadow-luxe hover:scale-[1.02] transition-all" style={{ background: "#1B6FB5" }}>
                  Découvrir MiPROJET Go <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/solutions/miprojet-plus" className="w-full sm:w-auto">
                <Button size="lg" className="w-full font-bold text-white shadow-luxe hover:scale-[1.02] transition-all" style={{ background: "#F97316" }}>
                  Découvrir MiPROJET+ <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/solutions/miprojet-invest" className="w-full sm:w-auto">
                <Button size="lg" className="w-full font-bold text-white shadow-luxe hover:scale-[1.02] transition-all" style={{ background: "#C9A84C" }}>
                  Découvrir MiPROJET Invest <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-5 pt-5 border-t border-white/15">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <s.icon className="h-4 w-4 text-secondary-glow" />
                    <span className="text-display text-2xl sm:text-3xl">{s.value}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-white/70 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right carousel */}
          <div className="lg:col-span-7 reveal-up" style={{ animationDelay: "0.15s" }}>
            <div className="relative rounded-3xl overflow-hidden shadow-luxe ring-1 ring-white/15 bg-black/20 backdrop-blur-sm">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {slides.map((s) => (
                    <div key={s.id} className="flex-[0_0_100%] min-w-0 relative">
                      <Link to={s.href} className="block group/slide">
                        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden">
                          <img
                            src={s.image}
                            alt={s.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8s] ease-out group-hover/slide:scale-105"
                            loading="eager"
                            onError={(e) => ((e.currentTarget as HTMLImageElement).src = heroFallback)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                          <div className="absolute top-4 left-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white shadow-md",
                                s.type === "news" ? "bg-primary" : "bg-secondary"
                              )}
                            >
                              {s.type === "news" ? (
                                <Newspaper className="h-3.5 w-3.5" />
                              ) : (
                                <Target className="h-3.5 w-3.5" />
                              )}
                              {s.badge}
                            </span>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 text-white">
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight line-clamp-2 mb-2 drop-shadow-lg">
                              {s.title}
                            </h3>
                            <p className="text-sm sm:text-base text-white/85 line-clamp-2 mb-4 max-w-2xl">
                              {s.excerpt}
                            </p>
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary-glow group-hover/slide:gap-2.5 transition-all">
                              Découvrir <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrows */}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={scrollPrev}
                    aria-label="Précédent"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-11 sm:w-11 grid place-items-center rounded-full bg-white/90 hover:bg-white text-primary shadow-lg backdrop-blur-md transition-all hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={scrollNext}
                    aria-label="Suivant"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-11 sm:w-11 grid place-items-center rounded-full bg-white/90 hover:bg-white text-primary shadow-lg backdrop-blur-md transition-all hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => emblaApi?.scrollTo(i)}
                        aria-label={`Aller à la diapositive ${i + 1}`}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === selectedIdx ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
