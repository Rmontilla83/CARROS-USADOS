"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardStepData } from "@/components/forms/wizard-step-data";
import { WizardStepPhotos } from "@/components/forms/wizard-step-photos";
import { WizardStepVideo } from "@/components/forms/wizard-step-video";
import { WizardStepPrice } from "@/components/forms/wizard-step-price";
import { WizardStepDescription } from "@/components/forms/wizard-step-description";
import { WizardStepSummary } from "@/components/forms/wizard-step-summary";
import { initialWizardData, type WizardData } from "@/types/wizard";

const STEPS = [
  { label: "Datos", shortLabel: "Datos" },
  { label: "Fotos", shortLabel: "Fotos" },
  { label: "Video", shortLabel: "Video" },
  { label: "Precio", shortLabel: "Precio" },
  { label: "Descripción", shortLabel: "Desc." },
  { label: "Resumen", shortLabel: "Listo" },
] as const;

export default function PublishPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialWizardData);

  function handleNext(values: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...values }));
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Publicar Vehículo</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Completa los pasos para publicar tu vehículo
      </p>

      {/* Step indicator */}
      <div className="my-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    i < step
                      ? "border-accent bg-accent text-accent-foreground"
                      : i === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground"
                  )}
                >
                  {i < step ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "mt-1 text-[10px] sm:text-xs",
                    i === step
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.shortLabel}</span>
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 w-4 sm:mx-2 sm:w-8",
                    i < step ? "bg-accent" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        {step === 0 && <WizardStepData data={data} onNext={handleNext} />}
        {step === 1 && (
          <WizardStepPhotos data={data} onNext={handleNext} onBack={handleBack} />
        )}
        {step === 2 && (
          <WizardStepVideo data={data} onNext={handleNext} onBack={handleBack} />
        )}
        {step === 3 && (
          <WizardStepPrice data={data} onNext={handleNext} onBack={handleBack} />
        )}
        {step === 4 && (
          <WizardStepDescription
            data={data}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 5 && <WizardStepSummary data={data} onBack={handleBack} />}
      </div>
    </div>
  );
}
