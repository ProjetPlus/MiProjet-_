import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSEO } from "@/components/SEOHead";

export type SolutionConfig = {
  logo: string;
  name: string;
  slogan: string;
  mission: string;
  accent: string;
  audience: string[];
  features: { title: string; desc: string }[];
  ctaLabel: string;
  ctaHref: string;
  seoDescription: string;
};

export const SolutionPage = ({ cfg }: { cfg: SolutionConfig }) => {
  useSEO({ title: `${cfg.name} — ${cfg.slogan}`, description: cfg.seoDescription });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section
        className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${cfg.accent}12, ${cfg.accent}04)` }}
      >
        <div className="container-luxe grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <img src={cfg.logo} alt={cfg.name} className="h-20 md:h-24 w-auto mb-6" />
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: cfg.accent }}>
              {cfg.slogan}
            </p>
            <h1 className="text-display text-4xl md:text-5xl lg:text-6xl mb-5 leading-tight">
              {cfg.mission}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-xl">
              {cfg.seoDescription}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={cfg.ctaHref}>
                <Button
                  size="lg"
                  className="text-white font-bold shadow-lg"
                  style={{ background: cfg.accent }}
                >
                  {cfg.ctaLabel} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">Nous contacter</Button>
              </Link>
            </div>
          </div>
          <div
            className="rounded-3xl p-8 md:p-10 shadow-xl border-2"
            style={{ borderColor: `${cfg.accent}30`, background: "hsl(var(--card))" }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: cfg.accent }}>Pour qui ?</h2>
            <ul className="grid grid-cols-2 gap-2">
              {cfg.audience.map((a) => (
                <li key={a} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: cfg.accent }} />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container-luxe">
          <h2 className="text-display text-3xl md:text-4xl text-center mb-12">
            Ce que <span style={{ color: cfg.accent }}>{cfg.name}</span> vous apporte
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cfg.features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow"
              >
                <div
                  className="h-10 w-10 rounded-xl grid place-items-center mb-3 text-white font-bold"
                  style={{ background: cfg.accent }}
                >
                  ✓
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: cfg.accent }}>
        <div className="container-luxe text-center text-white">
          <h2 className="text-display text-3xl md:text-4xl mb-4">Prêt à démarrer avec {cfg.name} ?</h2>
          <p className="text-white/85 mb-8 max-w-xl mx-auto">{cfg.slogan}</p>
          <Link to={cfg.ctaHref}>
            <Button size="lg" variant="secondary" className="font-bold">
              {cfg.ctaLabel} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};
