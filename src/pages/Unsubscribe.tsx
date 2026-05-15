import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  const submit = async (payload: { token?: string; email?: string }) => {
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("unsubscribe", { body: payload });
      if (error || !(data as any)?.ok) throw new Error((data as any)?.error || error?.message || "Erreur inconnue");
      setStatus("ok");
      setMessage((data as any).email);
    } catch (e: any) {
      setStatus("err");
      setMessage(e?.message || "Erreur");
    }
  };

  useEffect(() => {
    if (token) submit({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-muted/30 grid place-items-center px-4 py-16">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-card p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/10">
          {status === "loading" && <Loader2 className="h-7 w-7 text-primary animate-spin" />}
          {status === "ok" && <CheckCircle2 className="h-7 w-7 text-primary" />}
          {status === "err" && <XCircle className="h-7 w-7 text-destructive" />}
          {status === "idle" && <Mail className="h-7 w-7 text-primary" />}
        </div>

        {status === "ok" ? (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">Désabonnement confirmé</h1>
            <p className="text-muted-foreground mb-6"><strong>{message}</strong> ne recevra plus aucun email marketing de MIPROJET.</p>
          </>
        ) : status === "err" ? (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">Lien invalide</h1>
            <p className="text-muted-foreground mb-4">{message}</p>
            <p className="text-sm text-muted-foreground mb-3">Saisissez votre adresse pour vous désabonner manuellement :</p>
            <form
              onSubmit={(e) => { e.preventDefault(); submit({ email: email.trim().toLowerCase() }); }}
              className="flex flex-col sm:flex-row gap-2 mb-4"
            >
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" />
              <Button type="submit">Me désabonner</Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">Désabonnement</h1>
            {token ? (
              <p className="text-muted-foreground">Traitement en cours…</p>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">Saisissez l'adresse à désabonner :</p>
                <form
                  onSubmit={(e) => { e.preventDefault(); submit({ email: email.trim().toLowerCase() }); }}
                  className="flex flex-col sm:flex-row gap-2 mb-4"
                >
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" />
                  <Button type="submit" disabled={status === "loading"}>Me désabonner</Button>
                </form>
              </>
            )}
          </>
        )}

        <Link to="/" className="text-sm text-primary hover:underline">← Retour à l'accueil</Link>
      </div>
    </div>
  );
}