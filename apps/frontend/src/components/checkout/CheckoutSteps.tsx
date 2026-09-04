import { CheckCircle2, ShoppingBag, Wallet } from "lucide-react";
import type { CheckoutStep } from "@/types/checkout";

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
  onStepClick: (step: CheckoutStep) => void;
}

/** 2-step simplified checkout */
const STEPS: { number: CheckoutStep; label: string; description: string; icon: typeof Wallet }[] =
  [
    { number: 1, label: "Tinjau", description: "Keranjang & Saldo", icon: ShoppingBag },
    { number: 2, label: "Konfirmasi", description: "Pesanan", icon: Wallet },
  ];

export function CheckoutSteps({ currentStep, onStepClick }: CheckoutStepsProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, index) => {
          const isDone = step.number < currentStep;
          const isActive = step.number === currentStep;
          const StepIcon = step.icon;

          return (
            <div key={step.number} className="flex items-center">
              {/* Step node */}
              <button
                type="button"
                onClick={() => onStepClick(step.number)}
                disabled={step.number > currentStep}
                className="flex flex-col items-center gap-2 group disabled:cursor-not-allowed"
                aria-current={isActive ? "step" : undefined}
              >
                <div
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isDone
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : isActive
                        ? "border-emerald-600 bg-emerald-600 text-white ring-4 ring-emerald-600/20 scale-110"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <StepIcon className="h-4.5 w-4.5" aria-hidden="true" />
                  )}
                </div>
                <div className="text-center hidden sm:block">
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isActive
                        ? "text-emerald-600"
                        : isDone
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-xs ${
                      isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </button>

              {/* Connector */}
              {index < STEPS.length - 1 && (
                <div
                  className={`w-24 sm:w-32 h-0.5 mx-2 transition-colors duration-500 ${
                    isDone ? "bg-emerald-600" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: current step text */}
      <p className="sm:hidden text-center text-xs text-muted-foreground mt-3">
        Langkah {currentStep} dari {STEPS.length} —{" "}
        <span className="font-semibold text-foreground">
          {STEPS.find((s) => s.number === currentStep)?.description}
        </span>
      </p>
    </div>
  );
}
