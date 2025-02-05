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
      title: "Capabilities",
      description: "Define your agent's capabilities",
      items: [
        {
          id: "capabilities-1",
          title: "System Prompt & Knowledge Base",
          description: "Configure your agent's behavior and knowledge",
          icon: Brain,
          component: (
            <div className="space-y-4 p-2">
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Input
                  id="system-prompt"
                  placeholder="Enter system prompt"
                  value={store.systemPrompt}
                  onChange={(e) =>
                    store.setCapabilities(e.target.value, store.knowledgeBase)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Knowledge Base</Label>
                <Card className="p-4 border-dashed">
                  <input
                    type="file"
                    accept=".pdf,.txt,.csv"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).map(
                        (file) => ({
                          name: file.name,
                          size: file.size,
                          type: file.type,
                        })
                      );
                      store.addKnowledgeBase(files);
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Max 20 files, 30MB each. Supported formats: PDF, TXT, CSV
                  </p>
                  {store.knowledgeBase.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Uploaded Files:</h4>
                      <ul className="space-y-2">
                        {store.knowledgeBase.map((file) => (
                          <li
                            key={file.name}
                            className="flex justify-between items-center"
                          >
                            <span>{file.name}</span>
                            <button
                              onClick={() =>
                                store.removeKnowledgeBase(file.name)
                              }
                              className="text-red-500 text-sm"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      level: 2,
      id: "appearance",
      title: "Appearance",
      description: "Customize your agent's appearance",
      items: [
        {
          id: "appearance-1",
          title: "Visual Customization",
          description: "Style your agent",
          icon: Brush,
          component: (
            <div className="space-y-6 p-2">
              <div className="space-y-4">
                <Label>Agent Icon</Label>
                <div className="flex items-center gap-4">
                  {store.agentIcon ? (
                    <div className="relative">
                      <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                        {store.agentIcon.file && (
                          <img
                            src={URL.createObjectURL(store.agentIcon.file)}
                            alt="Agent Icon"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() =>
                          store.setAppearance(
                            undefined,
                            store.userMessageColor,
                            store.agentMessageColor,
                            store.openingMessage,
                            store.quickMessages
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="agent-icon"
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Upload
                      </span>
                      <input
                        type="file"
                        id="agent-icon"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            store.setAppearance(
                              {
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                file: file,
                              },
                              store.userMessageColor,
                              store.agentMessageColor,
                              store.openingMessage,
                              store.quickMessages
                            );
                          }
                        }}
                      />
                    </label>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Upload a square image (recommended size: 256x256px)
                  </div>
                </div>
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
                <Label htmlFor="opening-message">Opening Message</Label>
                <Textarea
                  id="opening-message"
                  value={store.openingMessage}
                  onChange={(e) =>
                    store.setAppearance(
                      store.agentIcon,
                      store.userMessageColor,
                      store.agentMessageColor,
                      e.target.value,
                      store.quickMessages
                    )
                  }
                  placeholder="Enter the first message your agent will send"
                />
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
      title: "Review",
      description: "Review your agent configuration",
      items: [
        {
          id: "review-1",
          title: "Review",
          description: "Confirm your settings",
          icon: Settings,
          component: (
            <div className="space-y-4 p-2">
              <h3 className="font-medium">Basic Information</h3>
              <div className="space-y-2 ml-4">
                <p>Agent Name: {store.agentName}</p>
                <p>Description: {store.description}</p>
                <p>Primary Model: {store.primaryModel}</p>
                <p>Fallback Model: {store.fallbackModel}</p>
              </div>

              <h3 className="font-medium">Capabilities</h3>
              <div className="space-y-2 ml-4">
                <p>System Prompt: {store.systemPrompt}</p>
                <p>Knowledge Base Files: {store.knowledgeBase.length}</p>
              </div>

              <h3 className="font-medium">Appearance</h3>
              <div className="space-y-2 ml-4">
                <p>Agent Icon: {store.agentIcon?.name || "None"}</p>
                <p>User Message Color: {store.userMessageColor}</p>
                <p>Agent Message Color: {store.agentMessageColor}</p>
                <p>Opening Message: {store.openingMessage}</p>
                <p>Quick Messages: {store.quickMessages.length}</p>
              </div>

              <h3 className="font-medium">Pricing</h3>
              <div className="space-y-2 ml-4">
                <p>Type: {store.isPaid ? "Paid" : "Free"}</p>
                <p>Visibility: {store.isPublic ? "Public" : "Private"}</p>
              </div>
            </div>
          ),
        },
      ],
    },
  ];

  const handleComplete = useCallback(
    (selections: Record<number | string, string>) => {
      console.log(store);
      router.push('/create');
      return true;
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
