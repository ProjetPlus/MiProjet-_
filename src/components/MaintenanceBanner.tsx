import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

export const MaintenanceBanner = () => {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState<string>("Maintenance en cours. Merci de votre patience.");

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key,value")
        .in("key", ["maintenance_mode", "maintenance_message"]);
      if (ignore || !data) return;
      const map: Record<string, string> = {};
      data.forEach((r: any) => { map[r.key] = r.value; });
      setEnabled(map.maintenance_mode === "true");
      if (map.maintenance_message) setMessage(map.maintenance_message);
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { ignore = true; clearInterval(id); };
  }, []);

  if (!enabled) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{message}</span>
    </div>
  );
};