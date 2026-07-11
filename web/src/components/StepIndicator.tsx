import { Fragment } from "react";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = ["QVAC Parse", "WDK Sign", "Broadcast"];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Circles + connector lines */}
      <div className="flex items-center">
        {steps.map((_, i) => {
          const num = (i + 1) as 1 | 2 | 3;
          const done = currentStep > num;
          const active = currentStep === num;

          return (
            <Fragment key={i}>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                  done
                    ? "bg-accent text-surface"
                    : active
                      ? "border-2 border-accent bg-accent/15 text-accent"
                      : "bg-elevated text-faint border border-edge"
                }`}
              >
                {done ? "✓" : num}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors duration-500 ${
                    currentStep > num ? "bg-accent" : "bg-edge"
                  }`}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-3">
        {steps.map((label, i) => {
          const num = (i + 1) as 1 | 2 | 3;
          return (
            <span
              key={i}
              className={`text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                currentStep === num
                  ? "text-accent"
                  : currentStep > num
                    ? "text-subtle"
                    : "text-faint"
              }`}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
