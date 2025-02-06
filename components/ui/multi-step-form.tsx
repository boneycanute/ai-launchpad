"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeftIcon, LucideIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { create } from "zustand";
import { useAgentStore } from "@/store/agent-store";
import { useRouter } from "next/navigation";

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
              onClick={() =>
                setSelection(currentStep, option.id, options.length)
              }
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

interface MultiStepFormProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  formSteps: FormStep[];
  onComplete: (
    selections: Record<number | string, string>
  ) => boolean | Promise<boolean>;
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
    const router = useRouter();
    const { currentStep, setStep, selections } = useFormStore();
    const store = useAgentStore();
    const [canFinish, setCanFinish] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleBack = () => {
      const prevStep = currentStep - 1;
      if (prevStep >= 0) {
        setStep(prevStep);
        if (onPrevStep) {
          onPrevStep(prevStep);
        }
      }
    };

    const handleNext = () => {
      const nextStep = currentStep + 1;
      if (nextStep < formSteps.length) {
        setStep(nextStep);
        if (onNextStep) {
          onNextStep(nextStep);
        }
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

    const handleComplete = async () => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        // Call onComplete first to validate
        const isValid = await onComplete(selections);
        if (!isValid) {
          setIsSubmitting(false);
          return;
        }

        // Generate agent_id: agent_name-user_id-timestamp
        const timestamp = Math.floor(Date.now() / 1000);
        const agentId = `${store.agentName
          .toLowerCase()
          .replace(/\s+/g, "-")}-${store.userId}-${timestamp}`;

        // Send data to API and wait for it to at least start
        const response = await fetch("/api/agent/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...store,
            agent_id: agentId,
          }),
        });

        // Start processing response but don't wait for it
        response.json().catch(console.error);

        // Navigate to create status page with agent_id
        router.replace(`/create?agentId=${agentId}`);
      } catch (error) {
        console.error("Error starting agent creation:", error);
        setIsSubmitting(false);
      }
    };

    const shouldShowOptions =
      stepOptions && (!isSuccessStep || (!children && !finalStep));
    const shouldShowComplete = isLastStep && !showSuccess && !children;

    React.useEffect(() => {
      if (isLastStep) {
        // Always enable the button on the last step since validation is handled by isStepValid
        setCanFinish(true);
      }
    }, [isLastStep]);

    const isNextDisabled = isStepValid ? !isStepValid(currentStep) : false;

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center w-full", className)}
        {...props}
      >
        <div className="w-full max-w-5xl p-2">
          <Card className="w-full mx-auto shadow-lg">
            <div className="p-6">
              {title && (
                <div className="mb-8 text-center">
                  <h1 className="text-2xl font-bold">{title}</h1>
                </div>
              )}
              <Progress
                value={((currentStep + 1) / formSteps.length) * 100}
                className="h-2 mb-8"
              />

              <div className="flex flex-col space-y-8">
                <div className="min-h-[400px]">
                  {shouldShowOptions && stepOptions && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-center">
                        {stepOptions.title}
                      </h2>
                      <FormCard
                        options={stepOptions.options}
                        variant={variant}
                        cardClassName={cardClassName}
                        imageClassName={imageClassName}
                        iconClassName={iconClassName}
                      />
                    </div>
                  )}
                  {isSuccessStep && children}
                  {isSuccessStep && finalStep && showSuccess && finalStep}
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div className="flex gap-4">
                    {!isLastStep && (
                      <Button onClick={handleNext} disabled={isNextDisabled}>
                        Next
                      </Button>
                    )}
                    {shouldShowComplete && (
                      <Button
                        onClick={handleComplete}
                        disabled={!canFinish || isSubmitting}
                      >
                        Create Agent
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }
);
MultiStepForm.displayName = "MultiStepForm";

export { MultiStepForm };
