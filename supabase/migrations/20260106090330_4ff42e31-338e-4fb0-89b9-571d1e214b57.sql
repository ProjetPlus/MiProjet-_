-- Create news/actualités table
CREATE TABLE public.news (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    video_url TEXT,
    category TEXT DEFAULT 'general',
    author_id UUID NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news
CREATE POLICY "Anyone can read published news" 
ON public.news 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admins can manage all news" 
ON public.news 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Create FAQ table
CREATE TABLE public.faqs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for faqs
CREATE POLICY "Anyone can read active FAQs" 
ON public.faqs 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage FAQs" 
ON public.faqs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_news_status ON public.news(status);
CREATE INDEX idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX idx_news_category ON public.news(category);
CREATE INDEX idx_faqs_category ON public.faqs(category);
CREATE INDEX idx_faqs_sort_order ON public.faqs(sort_order);

-- Add triggers for updated_at
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for news
ALTER PUBLICATION supabase_realtime ADD TABLE public.news;