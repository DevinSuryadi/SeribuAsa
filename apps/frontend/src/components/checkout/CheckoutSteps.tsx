import { CheckCircle2 } from "lucide-react";
import type { CheckoutStep } from "@/types/checkout";

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
  onStepClick: (step: CheckoutStep) => void;
}

const STEPS: { number: CheckoutStep; label: string; description: string }[] = [
  { number: 1, label: "Tinjau", description: "Keranjang" },
  { number: 2, label: "Voucher", description: "Terapkan" },
  { number: 3, label: "Konfirmasi", description: "Pesanan" },
  { number: 4, label: "Selesai", description: "Sukses" },
];

/**
 * CheckoutSteps - Step indicator for checkout flow
 */
export function CheckoutSteps({ currentStep, onStepClick }: CheckoutStepsProps) {
  return (
    <div className="w-full">
      {/* Desktop View - Horizontal */}
      <div className="hidden md:flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <button
              onClick={() => onStepClick(step.number)}
              disabled={step.number > currentStep}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                step.number < currentStep
                  ? "bg-green-600 text-white cursor-pointer hover:bg-green-700"
                  : step.number === currentStep
                    ? "bg-blue-600 text-white scale-110"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {step.number < currentStep ? <CheckCircle2 size={24} /> : step.number}
            </button>

            {/* Step Label */}
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">{step.label}</p>
              <p className="text-sm font-bold text-gray-900">{step.description}</p>
            </div>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-colors ${
                  step.number < currentStep ? "bg-green-600" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile View - Vertical */}
      <div className="md:hidden space-y-4 mb-6">
        {STEPS.map((step) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step.number < currentStep
                  ? "bg-green-600 text-white"
                  : step.number === currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {step.number < currentStep ? <CheckCircle2 size={20} /> : step.number}
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-gray-900">
                {step.label} - {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Current Step Indicator */}
      <div className="md:hidden text-center mb-6 pb-6 border-b border-gray-200">
        <p className="text-sm text-gray-600">Langkah {currentStep} dari 4</p>
      </div>
    </div>
  );
}
