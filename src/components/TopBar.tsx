import { Link } from "react-router-dom";
import { Phone, MapPin, Facebook, Linkedin, Instagram, Youtube } from "lucide-react";

export const TopBar = () => {
  return (
    <div className="hidden md:block bg-gradient-to-r from-accent via-accent to-secondary text-accent-foreground text-xs">
      <div className="container-luxe flex items-center justify-between h-9">
        <div className="flex items-center gap-5 font-medium">
          <Link to="/projects" className="hover:opacity-80 transition-opacity">Porteurs de projets</Link>
          <span className="opacity-40">|</span>
          <Link to="/investors" className="hover:opacity-80 transition-opacity">Investisseurs</Link>
          <span className="opacity-40">|</span>
          <Link to="/services" className="hover:opacity-80 transition-opacity">Entreprises</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/contact" className="flex items-center gap-1.5 hover:opacity-80">
            <MapPin className="h-3.5 w-3.5" /> Agences & contact
          </Link>
          <span className="opacity-40">|</span>
          <a href="tel:+22507071679" className="flex items-center gap-1.5 hover:opacity-80">
            <Phone className="h-3.5 w-3.5" /> +225 07 07 16 79 21
          </a>
          <span className="opacity-40">|</span>
          <div className="flex items-center gap-2">
            <a href="#" aria-label="Facebook" className="hover:opacity-80"><Facebook className="h-3.5 w-3.5" /></a>
            <a href="#" aria-label="LinkedIn" className="hover:opacity-80"><Linkedin className="h-3.5 w-3.5" /></a>
            <a href="#" aria-label="Instagram" className="hover:opacity-80"><Instagram className="h-3.5 w-3.5" /></a>
            <a href="#" aria-label="YouTube" className="hover:opacity-80"><Youtube className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      </div>
    </div>
  );
};
