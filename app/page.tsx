"use client";

import { Brain, Brush, Info, Puzzle, Settings } from "lucide-react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import MultiStepForm from "@/components/ui/multi-step-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Upload, X } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";
import { FileUploadField } from "@/components/agent-form/file-upload-field";

type ModelType = "openai" | "claude" | "deepseek";

export default function Home() {
  const store = useAgentStore();
  const router = useRouter();

  const isStepValid = (step: number) => {
    switch (step) {
      case 0: // Basic Info
        return (
          store.agentName.trim() !== "" &&
          store.description.trim() !== "" &&
          store.primaryModel !== null &&
          store.fallbackModel !== null
        );
      case 1: // System Prompt & Knowledge Base
        return store.systemPrompt.trim() !== "";
      case 2: // Visual Customization
        return (
          store.openingMessage.trim() !== "" &&
          store.userMessageColor !== "" &&
          store.agentMessageColor !== ""
        );
      case 3: // Pricing Settings
        return true; // All fields are toggles with default values
      case 4: // Review
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  const handleNextStep = (step: number) => {
    // You can add any additional logic here when moving to next step
  };

  const handlePrevStep = (step: number) => {
    // You can add any additional logic here when moving to previous step
  };

  const formSteps = [
    {
      level: 0,
      id: "basic-info",
      title: "Basic Information",
      description: "Set up the core details of your AI agent",
      items: [
        {
          id: "basic-info-1",
          title: "Basic Info",
          description: "Configure the fundamental settings",
          icon: Info,
          component: (
            <div className="space-y-4 p-2">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  placeholder="Enter agent name"
                  value={store.agentName}
                  onChange={(e) =>
                    store.setBasicInfo(
                      e.target.value,
                      store.description,
                      store.primaryModel,
                      store.fallbackModel
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter agent description"
                  value={store.description}
                  onChange={(e) =>
                    store.setBasicInfo(
                      store.agentName,
                      e.target.value,
                      store.primaryModel,
                      store.fallbackModel
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary-model">Primary AI Model</Label>
                <Select
                  value={store.primaryModel}
                  onValueChange={(value: ModelType) =>
                    store.setBasicInfo(
                      store.agentName,
                      store.description,
                      value,
                      store.fallbackModel
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallback-model">Fallback AI Model</Label>
                <Select
                  value={store.fallbackModel}
                  onValueChange={(value: ModelType) =>
                    store.setBasicInfo(
                      store.agentName,
                      store.description,
                      store.primaryModel,
                      value
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a fallback model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      level: 1,
      id: "capabilities",
      title: "System Prompt & Knowledge Base",
      description: "Define how your agent thinks and what it knows",
      items: [
        {
          id: "capabilities-1",
          title: "System Prompt & Knowledge",
          description: "Configure the agent's behavior and knowledge",
          icon: Brain,
          component: (
            <div className="space-y-6 p-2">
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  placeholder="Enter system prompt"
                  value={store.systemPrompt}
                  onChange={(e) =>
                    store.setCapabilities(e.target.value, store.knowledgeBase)
                  }
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Knowledge Base</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload documents to give your agent specialized knowledge
                </p>
                <FileUploadField type="knowledge" />
                
                {store.knowledgeBase.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Uploaded Documents</Label>
                    <div className="space-y-2">
                      {store.knowledgeBase.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => store.removeKnowledgeBase(file.name)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ),
        },
      ],
    },
    {
      level: 2,
      id: "appearance",
      title: "Visual Customization",
      description: "Customize your agent's appearance",
      items: [
        {
          id: "appearance-1",
          title: "Visual Settings",
          description: "Configure the visual elements",
          icon: Brush,
          component: (
            <div className="space-y-6 p-2">
              <div className="space-y-2">
                <Label>Agent Avatar</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload an avatar image for your agent
                </p>
                <FileUploadField type="avatar" />
                
                {store.agentIcon && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between p-2 border rounded-md">
                      <span className="text-sm truncate">{store.agentIcon.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => store.setAppearance(
                          undefined,
                          store.userMessageColor,
                          store.agentMessageColor,
                          store.openingMessage,
                          store.quickMessages
                        )}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening-message">Opening Message</Label>
                <Input
                  id="opening-message"
                  placeholder="Enter opening message"
                  value={store.openingMessage}
                  onChange={(e) => store.setAppearance(
                    store.agentIcon,
                    store.userMessageColor,
                    store.agentMessageColor,
                    e.target.value,
                    store.quickMessages
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Message Colors</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="user-message-color"
                      className="text-sm text-muted-foreground"
                    >
                      User Messages
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: store.userMessageColor }}
                      />
                      <Input
                        type="color"
                        id="user-message-color"
                        value={store.userMessageColor}
                        onChange={(e) =>
                          store.setAppearance(
                            store.agentIcon,
                            e.target.value,
                            store.agentMessageColor,
                            store.openingMessage,
                            store.quickMessages
                          )
                        }
                        className="w-20 h-8 p-0 border-0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="agent-message-color"
                      className="text-sm text-muted-foreground"
                    >
                      Agent Messages
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: store.agentMessageColor }}
                      />
                      <Input
                        type="color"
                        id="agent-message-color"
                        value={store.agentMessageColor}
                        onChange={(e) =>
                          store.setAppearance(
                            store.agentIcon,
                            store.userMessageColor,
                            e.target.value,
                            store.openingMessage,
                            store.quickMessages
                          )
                        }
                        className="w-20 h-8 p-0 border-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Quick Messages</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      const message = prompt("Enter a quick message");
                      if (message) {
                        store.addQuickMessage(message);
                      }
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Message
                  </Button>
                </div>
                <div className="space-y-2">
                  {store.quickMessages.map((message, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-muted/50 p-2 rounded-md"
                    >
                      <span className="flex-1 text-sm">{message}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => store.removeQuickMessage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {store.quickMessages.length === 0 && (
                    <div className="text-sm text-muted-foreground italic">
                      No quick messages added yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      level: 3,
      id: "pricing",
      title: "Pricing",
      description: "Configure pricing settings",
      items: [
        {
          id: "pricing-1",
          title: "Pricing Settings",
          description: "Set up pricing and visibility",
          icon: Puzzle,
          component: (
            <div className="space-y-4 p-2">
              <div className="flex items-center justify-between">
                <Label>Pricing Type</Label>
                <div className="flex items-center gap-2">
                  <span>Free</span>
                  <Switch
                    checked={store.isPaid}
                    onCheckedChange={(checked) =>
                      store.setPricing(checked, store.isPublic)
                    }
                  />
                  <span>Paid</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Make Public</Label>
                <Switch
                  checked={store.isPublic}
                  onCheckedChange={(checked) =>
                    store.setPricing(store.isPaid, checked)
                  }
                />
              </div>
            </div>
          ),
        },
      ],
    },
    {
      level: 4,
      id: "review",
      title: "",
      description: "",
      items: [
        {
          id: "review-1",
          title: "",
          description: "",
          icon: Settings,
          component: (
            <div className="space-y-4 p-2">
              <pre className="p-4 bg-secondary/50 rounded-lg overflow-auto">
                {JSON.stringify({
                  userId: store.userId,
                  agentName: store.agentName,
                  description: store.description,
                  primaryModel: store.primaryModel,
                  fallbackModel: store.fallbackModel,
                  systemPrompt: store.systemPrompt,
                  knowledgeBase: store.knowledgeBase,
                  agentIcon: store.agentIcon,
                  userMessageColor: store.userMessageColor,
                  agentMessageColor: store.agentMessageColor,
                  openingMessage: store.openingMessage,
                  quickMessages: store.quickMessages,
                  isPaid: store.isPaid,
                  isPublic: store.isPublic
                }, null, 2)}
              </pre>
            </div>
          ),
        },
      ],
    },
  ];

  const handleComplete = useCallback(
    async (selections: Record<number | string, string>) => {
      try {
        const response = await fetch('/api/agent/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: store.agentName,
            user_id: store.userId,
            documentUrls: store.knowledgeBase.map(file => file.url),
            logoUrl: store.agentIcon?.url,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          // Redirect to the creation status page with the agent ID
          router.push(`/create?agentId=${data.agentId}`);
          return true;
        } else {
          console.error('Failed to create agent:', data.message);
          return false;
        }
      } catch (error) {
        console.error('Error creating agent:', error);
        return false;
      }
    },
    [store, router]
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-3xl">
        <MultiStepForm
          formSteps={formSteps}
          onComplete={handleComplete}
          isStepValid={isStepValid}
          onNextStep={handleNextStep}
          onPrevStep={handlePrevStep}
          className="bg-white"
          cardClassName="border-none shadow-none"
        />
      </div>
    </div>
  );
}
