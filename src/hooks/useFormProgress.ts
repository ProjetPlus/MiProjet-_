import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UseFormProgressOptions {
  formType: string;
  totalSteps: number;
  onComplete?: () => void;
}

interface FormProgress<T = Record<string, unknown>> {
  currentStep: number;
  data: T;
  isCompleted: boolean;
  isLoading: boolean;
  isSaving: boolean;
}

export function useFormProgress<T extends object>({
  formType,
  totalSteps,
  onComplete
}: UseFormProgressOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState<FormProgress<T>>({
    currentStep: 1,
    data: {} as T,
    isCompleted: false,
    isLoading: true,
    isSaving: false
  });

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!user) {
        setProgress(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('form_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('form_type', formType)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProgress({
            currentStep: data.current_step || 1,
            data: (data.data as T) || {} as T,
            isCompleted: data.is_completed || false,
            isLoading: false,
            isSaving: false
          });
        } else {
          setProgress(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading form progress:', error);
        setProgress(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadProgress();
  }, [user, formType]);

  // Save progress to database
  const saveProgress = useCallback(async (
    stepData: Partial<T>,
    step: number = progress.currentStep
  ) => {
    if (!user) return;

    setProgress(prev => ({ ...prev, isSaving: true }));

    try {
      const newData = { ...progress.data, ...stepData } as T;
      
      const { error } = await supabase
        .from('form_progress')
        .upsert([{
          user_id: user.id,
          form_type: formType,
          current_step: step,
          data: JSON.parse(JSON.stringify(newData)),
          is_completed: false,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'user_id,form_type'
        });

      if (error) throw error;

      setProgress(prev => ({
        ...prev,
        data: newData,
        currentStep: step,
        isSaving: false
      }));

      return true;
    } catch (error) {
      console.error('Error saving form progress:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder la progression",
        variant: "destructive"
      });
      setProgress(prev => ({ ...prev, isSaving: false }));
      return false;
    }
  }, [user, formType, progress.data, progress.currentStep, toast]);

  // Go to next step
  const nextStep = useCallback(async (stepData: Partial<T>) => {
    const nextStepNum = Math.min(progress.currentStep + 1, totalSteps);
    const saved = await saveProgress(stepData, nextStepNum);
    if (saved) {
      setProgress(prev => ({ ...prev, currentStep: nextStepNum }));
    }
    return saved;
  }, [progress.currentStep, totalSteps, saveProgress]);

  // Go to previous step
  const prevStep = useCallback(() => {
    const prevStepNum = Math.max(progress.currentStep - 1, 1);
    setProgress(prev => ({ ...prev, currentStep: prevStepNum }));
  }, [progress.currentStep]);

  // Go to specific step
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setProgress(prev => ({ ...prev, currentStep: step }));
    }
  }, [totalSteps]);

  // Complete the form
  const complete = useCallback(async (finalData: Partial<T>) => {
    if (!user) return false;

    setProgress(prev => ({ ...prev, isSaving: true }));

    try {
      const completeData = { ...progress.data, ...finalData } as T;

      const { error } = await supabase
        .from('form_progress')
        .upsert([{
          user_id: user.id,
          form_type: formType,
          current_step: totalSteps,
          data: JSON.parse(JSON.stringify(completeData)),
          is_completed: true,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'user_id,form_type'
        });

      if (error) throw error;

      setProgress(prev => ({
        ...prev,
        data: completeData,
        isCompleted: true,
        isSaving: false
      }));

      toast({
        title: "Formulaire soumis",
        description: "Votre demande a été enregistrée avec succès"
      });

      onComplete?.();
      return true;
    } catch (error) {
      console.error('Error completing form:', error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre le formulaire",
        variant: "destructive"
      });
      setProgress(prev => ({ ...prev, isSaving: false }));
      return false;
    }
  }, [user, formType, totalSteps, progress.data, toast, onComplete]);

  // Reset the form
  const reset = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('form_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('form_type', formType);

      setProgress({
        currentStep: 1,
        data: {} as T,
        isCompleted: false,
        isLoading: false,
        isSaving: false
      });
    } catch (error) {
      console.error('Error resetting form:', error);
    }
  }, [user, formType]);

  // Update field in current step data
  const updateField = useCallback((field: keyof T, value: unknown) => {
    setProgress(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value }
    }));
  }, []);

  return {
    ...progress,
    saveProgress,
    nextStep,
    prevStep,
    goToStep,
    complete,
    reset,
    updateField,
    totalSteps
  };
}