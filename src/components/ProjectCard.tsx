import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Lock, Eye } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  id?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  fundingType?: string;
  status?: "in_structuring" | "validated" | "oriented";
  score: "A" | "B" | "C" | "D";
  image: string;
  fundingGoal?: number;
  currentFunding?: number;
  backers?: number;
  daysLeft?: number;
}

export const ProjectCard = ({
  id,
  title,
  description,
  category,
  location,
  fundingType = "Investissement en capital",
  status = "validated",
  score,
  image,
}: ProjectCardProps) => {
  const { t } = useLanguage();
  
  const scoreColors = {
    A: "bg-success text-white",
    B: "bg-warning text-white",
    C: "bg-info text-white",
    D: "bg-muted-foreground text-white",
  };

  const statusConfig = {
    in_structuring: { 
      label: t('projects.status.inStructuring'), 
      color: "bg-warning/20 text-warning border-warning/30",
      progress: 40,
    },
    validated: { 
      label: t('projects.status.validated'), 
      color: "bg-success/20 text-success border-success/30",
      progress: 70,
    },
    oriented: { 
      label: t('projects.status.oriented'), 
      color: "bg-primary/20 text-primary border-primary/30",
      progress: 100,
    },
  };

  const currentStatus = statusConfig[status];
  const projectLink = id ? `/projects/${id}` : "/projects";

  return (
    <Card className="group hover:shadow-glow transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col">
      <Link to={projectLink}>
        <div className="relative h-40 sm:h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <Badge className="bg-primary text-primary-foreground text-xs">
              {category}
            </Badge>
            <Badge className={scoreColors[score] + " text-xs"}>
              Score {score}
            </Badge>
          </div>
        </div>
      </Link>

      <CardHeader className="pb-2">
        <Link to={projectLink}>
          <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>

        <div className="text-xs sm:text-sm">
          <span className="text-muted-foreground">{t('projects.fundingType')}: </span>
          <span className="font-medium text-foreground">{fundingType}</span>
        </div>

        <Badge variant="outline" className={`${currentStatus.color} w-fit text-xs`}>
          {currentStatus.label}
        </Badge>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t('projects.progressLabel')}</p>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${currentStatus.progress}%` }}
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-2 sm:p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Lock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
          <p className="line-clamp-2">{t('projects.financialAccess')}</p>
        </div>

        <div className="mt-auto pt-2">
          <Link to={id ? `/access-request/${id}` : "/projects"}>
            <Button variant="outline" className="w-full text-xs sm:text-sm" size="sm">
              <Eye className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {t('projects.requestAccess')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
