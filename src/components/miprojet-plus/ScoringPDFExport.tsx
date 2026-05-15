interface ScoringPDFExportProps {
  score: number;
  niveau: string;
  scores: {
    juridique: number;
    financier: number;
    technique: number;
    marche: number;
    impact: number;
  };
  projectTitle: string;
  date: string;
}

const NIVEAU_LABELS: Record<string, string> = {
  financable: "Finançable",
  prometteur: "Prometteur",
  fragile: "Fragile",
  non_financable: "Non finançable",
};

const NIVEAU_COLORS: Record<string, string> = {
  financable: "#059669",
  prometteur: "#2563eb",
  fragile: "#d97706",
  non_financable: "#dc2626",
};

export const exportScoringPDF = ({ score, niveau, scores, projectTitle, date }: ScoringPDFExportProps) => {
  const color = NIVEAU_COLORS[niveau] || "#6b7280";
  const niveauLabel = NIVEAU_LABELS[niveau] || niveau;

  // Generate SVG radar chart
  const axes = [
    { label: "Juridique", value: scores.juridique, max: 15 },
    { label: "Financier", value: scores.financier, max: 25 },
    { label: "Technique", value: scores.technique, max: 20 },
    { label: "Marché", value: scores.marche, max: 20 },
    { label: "Impact", value: scores.impact, max: 20 },
  ];

  const cx = 200, cy = 160, r = 120;
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2;

  const gridPoints = (radius: number) =>
    axes.map((_, i) => {
      const angle = startAngle + i * angleStep;
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    }).join(" ");

  const dataPoints = axes.map((a, i) => {
    const pct = a.value / a.max;
    const angle = startAngle + i * angleStep;
    return `${cx + r * pct * Math.cos(angle)},${cy + r * pct * Math.sin(angle)}`;
  }).join(" ");

  const labelPositions = axes.map((a, i) => {
    const angle = startAngle + i * angleStep;
    const lr = r + 30;
    return { x: cx + lr * Math.cos(angle), y: cy + lr * Math.sin(angle), label: `${a.label} (${a.value}/${a.max})` };
  });

  const radarSVG = `
    <svg width="400" height="340" xmlns="http://www.w3.org/2000/svg">
      <polygon points="${gridPoints(r)}" fill="none" stroke="#e5e7eb" stroke-width="1"/>
      <polygon points="${gridPoints(r * 0.75)}" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
      <polygon points="${gridPoints(r * 0.5)}" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
      <polygon points="${gridPoints(r * 0.25)}" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
      ${axes.map((_, i) => {
        const angle = startAngle + i * angleStep;
        return `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(angle)}" y2="${cy + r * Math.sin(angle)}" stroke="#e5e7eb" stroke-width="0.5"/>`;
      }).join("")}
      <polygon points="${dataPoints}" fill="${color}22" stroke="${color}" stroke-width="2.5"/>
      ${labelPositions.map(l => `<text x="${l.x}" y="${l.y}" text-anchor="middle" font-size="10" fill="#374151" font-family="Arial">${l.label}</text>`).join("")}
    </svg>`;

  const recommendations: Record<string, string[]> = {
    financable: ["Demandez la Certification MIPROJET", "Présentez votre projet à notre réseau de financeurs", "Préparez votre pitch deck investisseur"],
    prometteur: ["Renforcez les axes faibles identifiés", "Envisagez un accompagnement structuration", "Documentez vos processus financiers"],
    fragile: ["Formalisez votre statut juridique", "Mettez en place une comptabilité régulière", "Suivez notre programme d'incubation"],
    non_financable: ["Enregistrez officiellement votre activité", "Ouvrez un compte bancaire dédié", "Suivez nos formations en gestion", "Contactez notre équipe d'accompagnement"],
  };

  const recs = recommendations[niveau] || recommendations.non_financable;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>MIPROJET SCORE - ${projectTitle}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: white; }
  .page { width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${color}; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { font-size: 24px; font-weight: 800; color: #1f2937; }
  .logo .plus { color: #059669; }
  .date { font-size: 12px; color: #6b7280; }
  .project-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
  .score-section { display: flex; gap: 24px; margin: 24px 0; align-items: center; }
  .score-circle { width: 120px; height: 120px; border-radius: 50%; border: 6px solid ${color}; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .score-value { font-size: 36px; font-weight: 800; color: ${color}; }
  .score-label { font-size: 12px; color: #6b7280; }
  .niveau-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; background: ${color}15; color: ${color}; font-weight: 700; font-size: 14px; border: 2px solid ${color}; }
  .radar-section { text-align: center; margin: 24px 0; }
  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
  .detail-card { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
  .detail-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .detail-value { font-size: 18px; font-weight: 700; color: #1f2937; }
  .detail-bar { height: 6px; border-radius: 3px; background: #f3f4f6; margin-top: 6px; }
  .detail-fill { height: 100%; border-radius: 3px; background: ${color}; }
  .recommendations { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0; }
  .rec-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
  .rec-item { display: flex; align-items: flex-start; gap: 8px; margin: 8px 0; font-size: 13px; color: #374151; }
  .rec-bullet { width: 6px; height: 6px; border-radius: 50%; background: ${color}; margin-top: 6px; flex-shrink: 0; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">MiProjet<span class="plus">+</span> SCORE</div>
      <div style="font-size:12px;color:#6b7280;">Rapport d'évaluation de projet</div>
    </div>
    <div class="date">${date}</div>
  </div>

  <div class="project-title">${projectTitle}</div>
  
  <div class="score-section">
    <div class="score-circle">
      <div class="score-value">${score}</div>
      <div class="score-label">sur 100</div>
    </div>
    <div>
      <div class="niveau-badge">${niveauLabel}</div>
      <p style="margin-top:8px;font-size:13px;color:#6b7280;max-width:300px;">
        ${score >= 80 ? "Projet structuré et prêt pour le financement." :
          score >= 60 ? "Projet en bonne voie, quelques améliorations nécessaires." :
          score >= 40 ? "Projet nécessitant un renforcement structurel." :
          "Projet en phase initiale, accompagnement recommandé."}
      </p>
    </div>
  </div>

  <div class="radar-section">${radarSVG}</div>

  <div class="details-grid">
    ${axes.map(a => `
      <div class="detail-card">
        <div class="detail-label">${a.label}</div>
        <div class="detail-value">${a.value}<span style="font-size:12px;color:#9ca3af">/${a.max}</span></div>
        <div class="detail-bar"><div class="detail-fill" style="width:${(a.value / a.max) * 100}%"></div></div>
      </div>
    `).join("")}
  </div>

  <div class="recommendations">
    <div class="rec-title">📋 Recommandations</div>
    ${recs.map(r => `<div class="rec-item"><div class="rec-bullet"></div>${r}</div>`).join("")}
  </div>

  <div class="footer">
    <p>MiProjet+ — Plateforme de structuration de projets | ivoireprojet.com/miprojet-plus</p>
    <p style="margin-top:4px;">© ${new Date().getFullYear()} MIPROJET — Tous droits réservés</p>
  </div>
</div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};
