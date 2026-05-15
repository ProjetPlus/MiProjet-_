import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X, MapPin, Building2, Tag, Globe } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface ProjectFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClear: () => void;
}

export interface FilterState {
  search?: string;
  sector: string;
  category: string;
  country: string;
  region: string;
  city: string;
  minAmount?: string;
  maxAmount?: string;
  minFunding?: string;
  maxFunding?: string;
  riskScore?: string;
}

const sectors = [
  "Agriculture",
  "Tech & Digital",
  "Éducation",
  "Santé",
  "Commerce",
  "Industrie",
  "Services",
  "Artisanat",
  "Énergie",
  "Immobilier",
  "Transport",
  "Tourisme",
  "Finance",
  "Environnement",
];

const categories = [
  "Startup",
  "PME",
  "Grande Entreprise",
  "Coopérative",
  "ONG",
  "Association",
];

const countries = [
  "Côte d'Ivoire",
  "Sénégal",
  "Mali",
  "Burkina Faso",
  "Guinée",
  "Togo",
  "Bénin",
  "Niger",
  "Cameroun",
  "Gabon",
  "Congo",
  "RDC",
  "Ghana",
  "Nigeria",
  "Kenya",
  "Tanzanie",
  "Éthiopie",
  "Afrique du Sud",
  "Maroc",
  "Tunisie",
  "Algérie",
  "Égypte",
];

const regions: Record<string, string[]> = {
  "Côte d'Ivoire": [
    "Abidjan",
    "Lagunes",
    "Comoé",
    "Sassandra-Marahoué",
    "Gôh-Djiboua",
    "Montagnes",
    "Savanes",
    "Vallée du Bandama",
    "Woroba",
    "Zanzan",
  ],
  "Sénégal": ["Dakar", "Thiès", "Saint-Louis", "Diourbel", "Kaolack", "Ziguinchor"],
  "Mali": ["Bamako", "Sikasso", "Ségou", "Mopti", "Koulikoro"],
  "Burkina Faso": ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora"],
};

export const ProjectFilters = ({ filters: externalFilters, onFilterChange, onClear }: ProjectFiltersProps) => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<FilterState>({
    search: externalFilters.search || "",
    sector: externalFilters.sector || "",
    category: externalFilters.category || "",
    country: externalFilters.country || "",
    region: externalFilters.region || "",
    city: externalFilters.city || "",
    minFunding: externalFilters.minAmount || externalFilters.minFunding || "",
    maxFunding: externalFilters.maxAmount || externalFilters.maxFunding || "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    // Debounce search
    const timeout = setTimeout(() => {
      onFilterChange(filters);
      updateActiveFilters();
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters]);

  const updateActiveFilters = () => {
    const active: string[] = [];
    if (filters.sector) active.push(`Secteur: ${filters.sector}`);
    if (filters.category) active.push(`Catégorie: ${filters.category}`);
    if (filters.country) active.push(`Pays: ${filters.country}`);
    if (filters.region) active.push(`Région: ${filters.region}`);
    if (filters.city) active.push(`Ville: ${filters.city}`);
    setActiveFilters(active);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const actualValue = value === "all" ? "" : value;
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: actualValue };
      // Reset dependent fields
      if (key === "country") {
        newFilters.region = "";
        newFilters.city = "";
      }
      if (key === "region") {
        newFilters.city = "";
      }
      return newFilters;
    });
  };

  const clearFilter = (filterLabel: string) => {
    const key = filterLabel.split(":")[0].trim();
    const keyMap: Record<string, keyof FilterState> = {
      Secteur: "sector",
      Catégorie: "category",
      Pays: "country",
      Région: "region",
      Ville: "city",
    };
    const filterKey = keyMap[key];
    if (filterKey) {
      handleFilterChange(filterKey, "");
    }
  };

  const clearAllFilters = () => {
    setFilters({
      search: "",
      sector: "",
      category: "",
      country: "",
      region: "",
      city: "",
      minFunding: "",
      maxFunding: "",
    });
  };

  const availableRegions = filters.country ? regions[filters.country] || [] : [];

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("projects.searchPlaceholder") || "Rechercher un projet..."}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filters.sector || "all"} onValueChange={(v) => handleFilterChange("sector", v)}>
            <SelectTrigger className="w-full sm:w-[160px] bg-background">
              <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
              <SelectValue placeholder="Secteur" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Tous les secteurs</SelectItem>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.country || "all"} onValueChange={(v) => handleFilterChange("country", v)}>
            <SelectTrigger className="w-full sm:w-[160px] bg-background">
              <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
              <SelectValue placeholder="Pays" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Tous les pays</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">
              {showAdvanced ? "Masquer" : "Plus de filtres"}
            </span>
          </Button>

          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-destructive">
              <X className="h-4 w-4 mr-1" />
              Effacer tout
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t">
            <Select value={filters.category || "all"} onValueChange={(v) => handleFilterChange("category", v)}>
              <SelectTrigger className="bg-background">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.region || "all"}
              onValueChange={(v) => handleFilterChange("region", v)}
              disabled={!filters.country}
            >
              <SelectTrigger className="bg-background">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Toutes les régions</SelectItem>
                {availableRegions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Ville"
              value={filters.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
            />

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min (FCFA)"
                value={filters.minFunding}
                onChange={(e) => handleFilterChange("minFunding", e.target.value)}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max (FCFA)"
                value={filters.maxFunding}
                onChange={(e) => handleFilterChange("maxFunding", e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => clearFilter(filter)}
              >
                {filter}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
