import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware';
import { uploadFileToS3, deleteFileFromS3 } from '@/lib/s3-upload'

export type FileUpload = {
  name: string
  size: number
  type: string
  file?: File
  url?: string
}

interface AgentStore {
  // Basic Info
  userId: string  // Added userId field
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
  // TODO: Replace this test userId with actual user ID from authentication
  userId: 'test-user-123',
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

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
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

      removeKnowledgeBase: async (fileName: string) => {
        const state = get()
        try {
          // Delete from S3 first
          await deleteFileFromS3(
            state.userId,
            state.agentName || 'default-agent',
            fileName,
            'knowledge'
          )
          
          // Then remove from state
          set(state => ({
            knowledgeBase: state.knowledgeBase.filter(file => file.name !== fileName)
          }))
        } catch (error) {
          console.error('Error removing knowledge base file:', error)
          set({ 
            uploadError: error instanceof Error ? error.message : 'Failed to remove file'
          })
        }
      },

      addQuickMessage: (message: string) => {
        set(state => ({
          quickMessages: [...state.quickMessages, message]
        }))
      },

      removeQuickMessage: (index: number) => {
        set(state => ({
          quickMessages: state.quickMessages.filter((_, i) => i !== index)
        }))
      },

      uploadKnowledgeBase: async (file: File) => {
        try {
          set({ isUploading: true, uploadError: null })
          const state = get()
          
          const url = await uploadFileToS3(
            file,
            state.userId,
            state.agentName || 'default-agent',
            'knowledge',
            (progress) => {
              // You can use this to update a progress indicator if needed
              console.log(`Upload progress: ${progress}%`)
            }
          )
          
          // Add to knowledge base array
          const newFile: FileUpload = {
            name: file.name,
            size: file.size,
            type: file.type,
            file,
            url
          }
          
          set(state => ({
            knowledgeBase: [...state.knowledgeBase, newFile],
            isUploading: false
          }))
        } catch (error) {
          console.error('Upload error:', error)
          set({ 
            isUploading: false, 
            uploadError: error instanceof Error ? error.message : 'Upload failed' 
          })
        }
      },
      
      uploadAgentIcon: async (file: File) => {
        try {
          set({ isUploading: true, uploadError: null })
          const state = get()
          
          // If there's an existing icon, delete it first
          if (state.agentIcon?.name) {
            await deleteFileFromS3(
              state.userId,
              state.agentName || 'default-agent',
              state.agentIcon.name,
              'avatar'
            )
          }
          
          const url = await uploadFileToS3(
            file,
            state.userId,
            state.agentName || 'default-agent',
            'avatar',
            (progress) => {
              // You can use this to update a progress indicator if needed
              console.log(`Upload progress: ${progress}%`)
            }
          )
          
          // Set as agent icon
          const newFile: FileUpload = {
            name: file.name,
            size: file.size,
            type: file.type,
            file,
            url
          }
          
          set({ agentIcon: newFile, isUploading: false })
        } catch (error) {
          console.error('Upload error:', error)
          set({ 
            isUploading: false, 
            uploadError: error instanceof Error ? error.message : 'Upload failed' 
          })
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'agent-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage
      partialize: (state) => ({ // only persist these fields
        userId: state.userId,
        agentName: state.agentName,
        description: state.description,
        primaryModel: state.primaryModel,
        fallbackModel: state.fallbackModel,
        systemPrompt: state.systemPrompt,
        userMessageColor: state.userMessageColor,
        agentMessageColor: state.agentMessageColor,
        openingMessage: state.openingMessage,
        quickMessages: state.quickMessages,
        isPaid: state.isPaid,
        isPublic: state.isPublic,
      })
    }
  )
);
