import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onStepClick?: (step: number) => void;
}

export const StepIndicator = ({ currentStep, totalSteps, stepTitles, onStepClick }: StepIndicatorProps) => {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {stepTitles.map((title, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <button
              key={index}
              onClick={() => isCompleted && onStepClick?.(stepNum)}
              disabled={!isCompleted}
              className={cn(
                "flex flex-col items-center gap-1 text-xs sm:text-sm transition-colors",
                isCompleted && "cursor-pointer hover:text-primary",
                isActive && "text-primary font-medium",
                !isActive && !isCompleted && "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isActive && "border-primary text-primary bg-primary/10",
                  !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : stepNum}
              </div>
              <span className="hidden sm:block max-w-[80px] text-center truncate">{title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface MultiStepFormProps {
  title: string;
  description?: string;
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  children: ReactNode;
  isSaving?: boolean;
  isLoading?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  onStepClick?: (step: number) => void;
  onSubmit?: () => void;
  isLastStep?: boolean;
  canProceed?: boolean;
  submitLabel?: string;
}

export const MultiStepForm = ({
  title,
  description,
  currentStep,
  totalSteps,
  stepTitles,
  children,
  isSaving = false,
  isLoading = false,
  onNext,
  onPrev,
  onStepClick,
  onSubmit,
  isLastStep = false,
  canProceed = true,
  submitLabel = "Soumettre"
}: MultiStepFormProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>

      {/* Step indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitles={stepTitles}
        onStepClick={onStepClick}
      />

      {/* Form content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Étape {currentStep}: {stepTitles[currentStep - 1]}
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={currentStep === 1 || isSaving}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Précédent
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving && (
            <>
              <Save className="h-4 w-4 animate-pulse" />
              <span>Sauvegarde...</span>
            </>
          )}
        </div>

        {isLastStep ? (
          <Button
            onClick={onSubmit}
            disabled={!canProceed || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canProceed || isSaving}
          >
            Suivant
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};