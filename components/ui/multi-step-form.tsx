"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeftIcon, LucideIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { create } from "zustand";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FormStore {
  currentStep: number;
  selections: Record<number | string, string>;
  setStep: (step: number) => void;
  setSelection: (step: number, selection: string, totalSteps: number) => void;
  reset: () => void;
  hasForm: boolean;
}

const useFormStore = create<FormStore>((set) => ({
  currentStep: 0,
  selections: {},
  setStep: (step) => set({ currentStep: step }),
  setSelection: (step, selection, totalSteps) =>
    set((state) => {
      const newSelections = { ...state.selections, [step]: selection };
      // Stay on last step unless we have a form
      const nextStep =
        step === totalSteps - 1
          ? state.hasForm
            ? totalSteps
            : step
          : step + 1;
      return {
        selections: newSelections,
        currentStep: nextStep,
      };
    }),
  reset: () => set({ currentStep: 0, selections: {} }),
  hasForm: false,
}));

export type FormStep = {
  level: number;
  id: string;
  title: string;
  description?: string;
  items: FormItem[];
};

export type FormItem = {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  image?: string;
  validNextSteps?: string[];
  component?: React.ReactNode;
};

interface OptionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  image?: string;
  selected?: boolean;
  onClick?: () => void;
  variant?: "default" | "compact";
  cardClassName?: string;
  imageClassName?: string;
  iconClassName?: string;
}

const OptionCard = React.forwardRef<HTMLDivElement, OptionCardProps>(
  (
    {
      title,
      description,
      icon: Icon,
      image,
      selected,
      onClick,
      variant = "default",
      cardClassName,
      imageClassName,
      iconClassName,
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary h-full",
          selected && "ring-2 ring-primary",
          cardClassName
        )}
        onClick={onClick}
      >
        {variant === "default" ? (
          <>
            {image ? (
              <div className="p-6">
                <Image
                  src={image}
                  alt={title}
                  width={variant === "default" ? 100 : 50}
                  height={variant === "default" ? 100 : 50}
                  className={cn(
                    "mx-auto",
                    variant === "default" ? "mb-4" : "mb-2",
                    imageClassName
                  )}
                />
              </div>
            ) : Icon ? (
              <div className="p-6">
                <Icon
                  className={cn(
                    "mx-auto",
                    variant === "default" ? "h-12 w-12 mb-4" : "h-8 w-8 mb-2",
                    iconClassName
                  )}
                />
              </div>
            ) : null}
            <div className="p-6 pt-0 text-center">
              <h3 className="font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {description}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="p-3 flex items-center gap-3">
            {image ? (
              <Image
                src={image}
                alt={title}
                width={24}
                height={24}
                className={imageClassName}
              />
            ) : Icon ? (
              <Icon className={cn("h-5 w-5", iconClassName)} />
            ) : null}
            <div>
              <h3 className="font-medium text-sm">{title}</h3>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  }
);
OptionCard.displayName = "OptionCard";

interface FormCardProps {
  options: FormItem[];
  variant?: "default" | "compact";
  totalSteps?: number;
  cardClassName?: string;
  imageClassName?: string;
  iconClassName?: string;
}

const FormCard = React.forwardRef<HTMLDivElement, FormCardProps>(
  (
    {
      options,
      variant = "default",
      cardClassName,
      imageClassName,
      iconClassName,
    },
    ref
  ) => {
    const { currentStep, setSelection } = useFormStore();

    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-4",
          variant === "default"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        )}
      >
        {options.map((option) => {
          if (option.component) {
            return (
              <div key={option.id} className="col-span-full">
                {option.component}
              </div>
            );
          }
          return (
            <OptionCard
              key={option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              image={option.image}
              onClick={() => setSelection(currentStep, option.id, 5)}
              variant={variant}
              cardClassName={cardClassName}
              imageClassName={imageClassName}
              iconClassName={iconClassName}
            />
          );
        })}
      </div>
    );
  }
);
FormCard.displayName = "FormCard";

interface StepOptions {
  title: string;
  options: FormStep["items"];
}

interface MultiStepFormProps {
  title?: React.ReactNode;
  formSteps: FormStep[];
  onComplete: (selections: Record<number | string, string>) => boolean;
  variant?: "default" | "compact";
  cardClassName?: string;
  imageClassName?: string;
  iconClassName?: string;
  children?: React.ReactNode;
  finalStep?: React.ReactNode;
  className?: string;
  isStepValid?: (step: number) => boolean;
  onNextStep?: (step: number) => void;
  onPrevStep?: (step: number) => void;
}

const MultiStepForm = React.forwardRef<HTMLDivElement, MultiStepFormProps>(
  (
    {
      title,
      formSteps,
      onComplete,
      variant = "default",
      cardClassName,
      imageClassName,
      iconClassName,
      children,
      finalStep,
      className,
      isStepValid,
      onNextStep,
      onPrevStep,
      ...props
    },
    ref
  ) => {
    const { currentStep, setStep, selections } = useFormStore();
    const [canFinish, setCanFinish] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);

    // Set hasForm on mount
    React.useEffect(() => {
      useFormStore.setState({ hasForm: Boolean(children) });
    }, [children]);

    const handleBack = () => {
      if (showSuccess) {
        setShowSuccess(false);
        return;
      }
      if (currentStep > 0) {
        onPrevStep?.(currentStep);
        setStep(currentStep - 1);
      }
    };

    const handleNext = () => {
      if (
        currentStep < formSteps.length - 1 &&
        (!isStepValid || isStepValid(currentStep))
      ) {
        onNextStep?.(currentStep);
        setStep(currentStep + 1);
      }
    };

    const getStepOptions = (
      currentStep: number,
      selections: Record<number | string, string>
    ): StepOptions | null => {
      const step = formSteps[currentStep];
      if (!step) return null;

      return {
        title: step.title,
        options: step.items,
      };
    };

    const isLastStep = currentStep === formSteps.length - 1;
    const isSuccessStep = currentStep === formSteps.length;
    const stepOptions = getStepOptions(currentStep, selections);
    const hasLastStepSelection = selections[formSteps.length - 1] !== undefined;

    const handleComplete = () => {
      if (finalStep) {
        // If no form, just use selections and show success
        const isValid = onComplete(selections);
        if (isValid) {
          setShowSuccess(true);
        }
      } else {
        onComplete(selections);
      }
    };

    const shouldShowOptions =
      stepOptions && (!isSuccessStep || (!children && !finalStep));
    const shouldShowComplete =
      isLastStep && !showSuccess && hasLastStepSelection && !children;

    React.useEffect(() => {
      if (isLastStep) {
        const hasSelection = selections[currentStep] !== undefined;
        setCanFinish(hasSelection);
      }
    }, [isLastStep, currentStep, selections]);

    const isNextDisabled = isStepValid ? !isStepValid(currentStep) : false;

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center", className)}
        {...props}
      >
        <div className="w-full max-w-5xl p-2 min-h-screen h-screen">
          <Card className="w-full mx-auto p-6 shadow-lg p-2 md:p-6 h-full">
            <div className="mb-8 p-4 md:p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-20">
                  {currentStep > 0 ? (
                    <Button
                      variant="link"
                      onClick={handleBack}
                      className="mr-4 p-0"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                      Back
                    </Button>
                  ) : (
                    <div className="invisible">
                      <Button variant="link" className="mr-4 p-0">
                        <ChevronLeftIcon className="h-5 w-5" />
                        Back
                      </Button>
                    </div>
                  )}
                </div>
                {title && <div className="flex items-center">{title}</div>}
                <div className="text-sm font-medium text-muted-foreground w-20 text-right">
                  {isSuccessStep
                    ? `${formSteps.length}/${formSteps.length}`
                    : `${currentStep + 1}/${formSteps.length}`}
                </div>
              </div>
              <Progress
                value={
                  isSuccessStep
                    ? 100
                    : ((currentStep + 1) / formSteps.length) * 100
                }
                className="h-2"
              />
              <div className="mt-4 text-center">
                {!isSuccessStep && stepOptions && (
                  <h1 className="text-2xl font-semibold mb-2">
                    {stepOptions.title}
                  </h1>
                )}
                {formSteps[currentStep]?.description && (
                  <p className="text-sm text-muted-foreground mx-auto max-w-md">
                    {formSteps[currentStep].description}
                  </p>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="flex-1"
              >
                {showSuccess ? (
                  finalStep
                ) : isSuccessStep && children ? (
                  children
                ) : shouldShowOptions ? (
                  <FormCard
                    options={stepOptions?.options || []}
                    variant={variant}
                    totalSteps={formSteps.length}
                    cardClassName={cardClassName}
                    imageClassName={imageClassName}
                    iconClassName={iconClassName}
                    key={`form-card-${currentStep}`}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              {isLastStep ? (
                <Button
                  onClick={handleComplete}
                  disabled={isStepValid && !isStepValid(currentStep)}
                >
                  Create Agent
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={isNextDisabled}>
                  Next
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }
);
MultiStepForm.displayName = "MultiStepForm";

export default MultiStepForm;
