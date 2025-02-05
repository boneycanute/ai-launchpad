import { create } from 'zustand'

export type FileUpload = {
  name: string
  size: number
  type: string
  file?: File
}

interface AgentStore {
  // Basic Info
  agentName: string
  description: string
  primaryModel: 'openai' | 'claude' | 'deepseek'
  fallbackModel: 'openai' | 'claude' | 'deepseek'
  
  // Capabilities
  systemPrompt: string
  knowledgeBase: FileUpload[]
  
  // Appearance
  agentIcon?: FileUpload
  userMessageColor: string
  agentMessageColor: string
  openingMessage: string
  quickMessages: string[]
  
  // Pricing
  isPaid: boolean
  isPublic: boolean
  
  // Actions
  setBasicInfo: (
    name: string, 
    description: string, 
    primaryModel: 'openai' | 'claude' | 'deepseek', 
    fallbackModel: 'openai' | 'claude' | 'deepseek'
  ) => void
  setCapabilities: (systemPrompt: string, files: FileUpload[]) => void
  setAppearance: (icon: FileUpload | undefined, userColor: string, agentColor: string, openingMsg: string, quickMsgs: string[]) => void
  setPricing: (isPaid: boolean, isPublic: boolean) => void
  addKnowledgeBase: (files: FileUpload[]) => void
  removeKnowledgeBase: (fileName: string) => void
  addQuickMessage: (message: string) => void
  removeQuickMessage: (index: number) => void
  reset: () => void
}

const initialState = {
  agentName: '',
  description: '',
  primaryModel: 'openai' as const,
  fallbackModel: 'openai' as const,
  systemPrompt: '',
  knowledgeBase: [],
  userMessageColor: '#ffffff',
  agentMessageColor: '#f0f0f0',
  openingMessage: '',
  quickMessages: [],
  isPaid: false,
  isPublic: false,
}

export const useAgentStore = create<AgentStore>((set) => ({
  ...initialState,

  setBasicInfo: (name, description, primaryModel, fallbackModel) => 
    set({ agentName: name, description, primaryModel, fallbackModel }),

  setCapabilities: (systemPrompt, files) => 
    set({ systemPrompt, knowledgeBase: files }),

  setAppearance: (icon, userColor, agentColor, openingMsg, quickMsgs) =>
    set({ agentIcon: icon, userMessageColor: userColor, agentMessageColor: agentColor, openingMessage: openingMsg, quickMessages: quickMsgs }),

  setPricing: (isPaid, isPublic) => 
    set({ isPaid, isPublic }),

  addKnowledgeBase: (files) =>
    set((state) => ({ 
      knowledgeBase: [...state.knowledgeBase, ...files].slice(0, 20) 
    })),

  removeKnowledgeBase: (fileName) =>
    set((state) => ({ 
      knowledgeBase: state.knowledgeBase.filter(file => file.name !== fileName) 
    })),

  addQuickMessage: (message) =>
    set((state) => ({ 
      quickMessages: [...state.quickMessages, message] 
    })),

  removeQuickMessage: (index) =>
    set((state) => ({ 
      quickMessages: state.quickMessages.filter((_, i) => i !== index) 
    })),

  reset: () => set(initialState),
}))
