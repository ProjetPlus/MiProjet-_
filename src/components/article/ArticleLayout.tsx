import { ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, Clock, Eye, BookOpen, Share2, ThumbsUp, MessageSquare, Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { resolveCover, onCoverError } from "@/lib/coverImage";
import { normalizeArticleHtml } from "@/lib/sanitizeHtml";

export interface RelatedItem {
  id: string;
  title: string;
  image?: string | null;
  date?: string | null;
  views?: number;
  href: string;
}

interface ArticleLayoutProps {
  /** Where the back button leads */
  backHref: string;
  backLabel?: string;
  /** Top tag (e.g. "Article", "Opportunité") */
  topTag?: string;
  /** Category label shown in meta strip */
  category?: string;
  /** Big H1 */
  title: string;
  /** Italic intro shown right under the title */
  subtitle?: string | null;
  /** Full-width hero image url */
  image?: string | null;
  imageAlt?: string;
  /** Meta */
  author?: string;
  dateISO?: string | null;
  readingMinutes?: number;
  /** Engagement counters */
  viewsCount?: number;
  fullReads?: number;
  sharesCount?: number;
  reactionsCount?: number;
  /** HTML content (will be rendered via dangerouslySetInnerHTML) */
  contentHtml: string;
  /** Optional sidebar / extra block above the content */
  preContent?: ReactNode;
  /** Optional content displayed under the article body but above share row */
  postContent?: ReactNode;
  /** Action buttons */
  onShare?: () => void;
  onReact?: () => void;
  /** Related items grid */
  relatedTitle?: string;
  relatedItems?: RelatedItem[];
  relatedHref?: string;
  /** CTA at the very end */
  newsletterTitle?: string;
  newsletterDescription?: string;
  onNewsletterSubmit?: (email: string) => void;
}

export const ArticleLayout = ({
  backHref,
  backLabel = "Retour",
  topTag,
  category,
  title,
  subtitle,
  image,
  imageAlt,
  author,
  dateISO,
  readingMinutes,
  viewsCount = 0,
  fullReads,
  sharesCount,
  reactionsCount,
  contentHtml,
  preContent,
  postContent,
  onShare,
  onReact,
  relatedTitle = "Articles similaires",
  relatedItems = [],
  relatedHref,
  newsletterTitle = "Restez Informé",
  newsletterDescription = "Inscrivez-vous à notre newsletter pour recevoir nos actualités, articles et perspectives sur l'écosystème entrepreneurial africain.",
  onNewsletterSubmit,
}: ArticleLayoutProps) => {
  const navigate = useNavigate();
  const heroSrc = resolveCover(image);
  const [readingMode, setReadingMode] = useState(true);
  const safeContentHtml = useMemo(() => normalizeArticleHtml(contentHtml), [contentHtml]);

  const Stat = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <Card className="border bg-card">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value ?? "—"}</p>
      </CardContent>
    </Card>
  );

  return (
    <article className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      {/* Back link */}
      <Button variant="ghost" className="mb-6 -ml-2 gap-2 hover:bg-muted" onClick={() => navigate(backHref)}>
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Button>

      {/* Hero image */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-border mb-8 aspect-[16/9] bg-muted">
        <img
          src={heroSrc}
          alt={imageAlt || title}
          className="w-full h-full object-cover"
          loading="eager"
          onError={onCoverError}
        />
      </div>

      {/* Top tag */}
      {topTag && (
        <Badge className="mb-4 gap-1.5 bg-muted text-foreground border border-border hover:bg-muted">
          <Tag className="h-3 w-3" /> {topTag}
        </Badge>
      )}

      {/* Title — clean, no accent bar (the bar lives in the body sections) */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-foreground mb-4">
        {title}
      </h1>

      {/* Subtitle / dek */}
      {subtitle && (
        <p className="text-lg md:text-xl italic text-muted-foreground leading-relaxed mb-6">
          {subtitle}
        </p>
      )}

      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground border-y border-border py-3 mb-6">
        {author && (
          <span className="flex items-center gap-1.5">
            <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              {author.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </span>
            {author}
          </span>
        )}
        {dateISO && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {format(new Date(dateISO), "d MMMM yyyy", { locale: fr })}
          </span>
        )}
        {readingMinutes ? (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {readingMinutes} min de lecture
          </span>
        ) : null}
        {category && (
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            {category}
          </Badge>
        )}
      </div>

      {/* Engagement stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Stat label="Vues" value={viewsCount} />
        <Stat label="Lectures complètes" value={fullReads ?? 0} />
        <Stat label="Partages" value={sharesCount ?? 0} />
        <Stat label="Réactions" value={reactionsCount ?? 0} />
      </div>

      {preContent}

      <div className="mb-6 flex justify-end">
        <Button type="button" variant={readingMode ? "default" : "outline"} size="sm" onClick={() => setReadingMode((v) => !v)} className="gap-2">
          <BookOpen className="h-4 w-4" /> Mode lecture
        </Button>
      </div>

      {/* Article body — sanitized Word-like professional typography */}
      <div
        className={`article-body ${readingMode ? "article-body--reading" : ""} prose prose-lg max-w-none text-foreground/90
          prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
          prose-h2:text-2xl md:prose-h2:text-[1.75rem] prose-h2:leading-snug
          prose-h2:mt-12 prose-h2:mb-5 prose-h2:pl-4 prose-h2:border-l-4 prose-h2:border-primary
          prose-h3:text-xl prose-h3:mt-9 prose-h3:mb-3 prose-h3:text-primary
          prose-h4:text-lg prose-h4:mt-7 prose-h4:mb-2 prose-h4:text-foreground
          prose-p:leading-[1.85] prose-p:mb-5 prose-p:text-justify
          prose-strong:text-foreground prose-strong:font-semibold
          prose-em:text-foreground/90
          prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:underline-offset-4 prose-a:decoration-primary/40 hover:prose-a:decoration-primary
          prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5
          prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg
          prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-foreground/90
          prose-img:rounded-xl prose-img:shadow-md prose-img:my-8 prose-img:mx-auto
          prose-figure:my-8 prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-muted-foreground prose-figcaption:mt-2
          prose-ul:my-5 prose-ul:pl-6 prose-ul:list-disc prose-ul:marker:text-primary
          prose-ol:my-5 prose-ol:pl-6 prose-ol:marker:text-primary prose-ol:marker:font-semibold
          prose-li:mb-2 prose-li:leading-relaxed prose-li:pl-1
          prose-hr:my-10 prose-hr:border-border
          prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-lg prose-pre:p-4 prose-pre:border prose-pre:border-border`}
        dangerouslySetInnerHTML={{ __html: safeContentHtml }}
      />

      {postContent}

      {/* Engagement bar */}
      <div className="mt-12 pt-8 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={onReact}>
              <ThumbsUp className="h-4 w-4" />
              <span className="font-semibold">{reactionsCount ?? 0}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={onShare}>
              <Share2 className="h-4 w-4" /> Partager
            </Button>
          </div>
          {relatedHref && (
            <Button onClick={() => navigate(relatedHref)} className="gap-2">
              Voir plus <BookOpen className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Comments placeholder (style ikoffi) */}
      <section className="mt-12 pt-8 border-t border-border">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Commentaires
        </h3>
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              Aucun commentaire pour le moment. Soyez le premier à réagir.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Related */}
      {relatedItems.length > 0 && (
        <section className="mt-16 pt-12 border-t border-border">
          <h2 className="text-2xl font-bold mb-8 text-center">{relatedTitle}</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedItems.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(r.href)}
                className="group text-left rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative h-40 overflow-hidden bg-muted">
                  {r.image && (
                    <img
                      src={r.image}
                      alt={r.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={onCoverError}
                    />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                    {r.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(r.date), "dd/MM/yyyy")}
                      </span>
                    )}
                    {typeof r.views === "number" && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {r.views}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {r.title}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="mt-16 -mx-4 px-4 py-12 sm:py-14 bg-primary text-primary-foreground rounded-2xl">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{newsletterTitle}</h2>
          <p className="opacity-90 mb-6 px-2">{newsletterDescription}</p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement)?.value;
              if (email && onNewsletterSubmit) onNewsletterSubmit(email);
            }}
          >
            <input
              name="email"
              type="email"
              required
              placeholder="Votre adresse email"
              className="flex h-10 w-full rounded-md border bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:border-accent px-3 py-2 outline-none"
            />
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 whitespace-nowrap">
              S'inscrire
            </Button>
          </form>
          <p className="text-xs opacity-70 mt-4">Pas de spam. Désinscription possible à tout moment.</p>
        </div>
      </section>
    </article>
  );
};