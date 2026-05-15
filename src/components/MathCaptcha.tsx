import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";

interface MathCaptchaProps {
  onValidChange: (isValid: boolean) => void;
}

type Operation = '+' | '-' | '×' | '÷';

const generateCaptcha = (): { question: string; answer: number } => {
  const ops: Operation[] = ['+', '-', '×', '÷'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 20) + 5;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      break;
    case '÷':
      b = Math.floor(Math.random() * 9) + 2;
      answer = Math.floor(Math.random() * 10) + 1;
      a = b * answer;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  return { question: `${a} ${op} ${b} = ?`, answer };
};

export const MathCaptcha = ({ onValidChange }: MathCaptchaProps) => {
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [userAnswer, setUserAnswer] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setCaptcha(generateCaptcha());
    setUserAnswer("");
    setError("");
    onValidChange(false);
  }, [onValidChange]);

  useEffect(() => {
    if (userAnswer === "") {
      onValidChange(false);
      setError("");
      return;
    }
    const num = parseInt(userAnswer, 10);
    if (isNaN(num)) {
      setError("Entrez un nombre valide");
      onValidChange(false);
    } else if (num === captcha.answer) {
      setError("");
      onValidChange(true);
    } else {
      setError("Réponse incorrecte");
      onValidChange(false);
    }
  }, [userAnswer, captcha.answer, onValidChange]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">🔒 Vérification de sécurité</Label>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="font-mono text-lg font-bold text-foreground">{captcha.question}</span>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          title="Nouveau calcul"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <Input
        type="number"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Votre réponse"
        className="text-center font-mono text-lg"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
