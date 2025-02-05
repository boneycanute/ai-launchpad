"use client"

import { FileUpload } from '@/components/ui/file-upload'
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentStore } from '@/store/agent-store'
import { cn } from "@/lib/utils";

interface FileUploadFieldProps {
  type: "knowledge" | "avatar"
}

export function FileUploadField({ type }: FileUploadFieldProps) {
  const store = useAgentStore();
  const files = type === "knowledge" ? store.knowledgeBase : (store.agentIcon ? [store.agentIcon] : []);

  const handleUpload = async (file: File) => {
    if (type === "knowledge") {
      await store.uploadKnowledgeBase(file);
    } else {
      await store.uploadAgentIcon(file);
    }
  };

  const handleRemove = (fileName: string) => {
    if (type === "knowledge") {
      store.removeKnowledgeBase(fileName);
    } else {
      store.set({ agentIcon: undefined });
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload
        onUpload={handleUpload}
        isUploading={store.isUploading}
        accept={type === "avatar" ? "image/*" : undefined}
      />
      
      {store.uploadError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          <X className="h-4 w-4" />
          <span>{store.uploadError}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full",
                  "bg-secondary/50 border border-border"
                )}
              >
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 hover:bg-secondary"
                  onClick={() => handleRemove(file.name)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
