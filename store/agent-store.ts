import { create } from 'zustand'
import { uploadToS3 } from '@/lib/utils/upload-to-s3'

export type FileUpload = {
  name: string
  size: number
  type: string
  file?: File
  url?: string
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
  
  // S3 Upload
  isUploading: boolean
  uploadError: string | null
  
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
  uploadKnowledgeBase: (file: File) => Promise<void>
  uploadAgentIcon: (file: File) => Promise<void>
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
  isUploading: false,
  uploadError: null,
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  ...initialState,

  setBasicInfo: (name, description, primaryModel, fallbackModel) => 
    set({ agentName: name, description, primaryModel, fallbackModel }),

  setCapabilities: (systemPrompt, files) => 
    set({ systemPrompt, knowledgeBase: files.map(file => ({ ...file, url: undefined })) }),

  setAppearance: (icon, userColor, agentColor, openingMsg, quickMsgs) =>
    set({ agentIcon: icon, userMessageColor: userColor, agentMessageColor: agentColor, openingMessage: openingMsg, quickMessages: quickMsgs }),

  setPricing: (isPaid, isPublic) => 
    set({ isPaid, isPublic }),

  addKnowledgeBase: (files) =>
    set((state) => ({ 
      knowledgeBase: [...state.knowledgeBase, ...files.map(file => ({ ...file, url: undefined }))].slice(0, 20) 
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

  uploadKnowledgeBase: async (file) => {
    set({ isUploading: true, uploadError: null });
    try {
      const url = await uploadToS3(file, 'document');
      set((state) => ({
        knowledgeBase: [...state.knowledgeBase, { ...file, url }],
        isUploading: false
      }));
    } catch (error) {
      set({ 
        uploadError: error instanceof Error ? error.message : 'Failed to upload document',
        isUploading: false 
      });
    }
  },

  uploadAgentIcon: async (file) => {
    set({ isUploading: true, uploadError: null });
    try {
      const url = await uploadToS3(file, 'logo');
      set({ agentIcon: { ...file, url }, isUploading: false });
    } catch (error) {
      set({ 
        uploadError: error instanceof Error ? error.message : 'Failed to upload logo',
        isUploading: false 
      });
    }
  },

  reset: () => set(initialState),
}))
