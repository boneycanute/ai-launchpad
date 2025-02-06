import { createClient } from "@/utils/supabase/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Define interfaces for type safety
interface KnowledgeBaseFile {
  name: string;
  size: number;
  type: string;
  file: any;
  url: string;
}

interface CreateVectorDBParams {
  agentId: string;
  userId: string;
  knowledgeBase?: KnowledgeBaseFile[];
}

interface VectorDBConfig {
  namespace: string;
  documentCount: number;
  documents: string[];
  status: "active" | "no_knowledge_base";
}

// Update agent status in Supabase
async function updateAgentStatus(agentId: string, status: string) {
  const supabase = await createClient(true);
  await supabase.from("agents").update({ status }).eq("id", agentId);
}

// Initialize S3 client
function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

// Get appropriate document loader based on file type
async function getDocumentLoader(file: KnowledgeBaseFile, s3Client: S3Client) {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  // Create get object command
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: file.url,
  });

  try {
    // Get file from S3
    const response = await s3Client.send(getObjectCommand);
    const buffer = await response.Body?.transformToByteArray();

    if (!buffer) {
      throw new Error("Failed to get file content from S3");
    }

    switch (fileExtension) {
      case "pdf":
        return new PDFLoader(new Blob([buffer], { type: "application/pdf" }), {
          splitPages: false,
        });
      case "csv":
        const csvText = new TextDecoder().decode(buffer);
        return new CSVLoader(new Blob([csvText], { type: "text/csv" }));
      default: // txt, md, etc.
        const text = new TextDecoder().decode(buffer);
        return new TextLoader(new Blob([text], { type: "text/plain" }));
    }
  } catch (error) {
    console.error(`Error loading file from S3:`, error);
    throw error;
  }
}

// Process document into chunks with metadata
async function processDocument(doc: Document, file: KnowledgeBaseFile) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  const chunks = await splitter.splitDocuments([doc]);

  return chunks.map((chunk, index) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      source: file.name,
      fileType: file.type,
      chunkIndex: index,
      timestamp: Date.now(),
      charCount: chunk.pageContent.length,
      tokenCount: Math.ceil(chunk.pageContent.length / 4), // Rough estimation
      documentId: `${file.name}_${Date.now()}`,
      lastUpdated: new Date().toISOString(),
      language: "en", // You might want to detect this
      processingStatus: "complete",
    },
  }));
}

// Main vector database creation function
export async function createVectorDB({
  agentId,
  userId,
  knowledgeBase,
}: CreateVectorDBParams): Promise<VectorDBConfig | null> {
  const supabase = await createClient(true);
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
  const s3Client = getS3Client();

  console.log("Creating vector DB for agent", agentId);

  try {
    // Update initial status
    await updateAgentStatus(agentId, "creating_vectordb");

    // Handle case with no knowledge base
    if (!knowledgeBase || knowledgeBase.length === 0) {
      const config = {
        namespace: `${userId}_${agentId}`,
        documentCount: 0,
        documents: [],
        status: "no_knowledge_base" as const,
      };

      await supabase
        .from("agents")
        .update({
          vector_db: config,
          creation_progress: {
            state: "creating_vectordb",
            message: "No knowledge base provided",
            updated_at: new Date().toISOString(),
          },
        })
        .eq("id", agentId);

      return config;
    }

    const indexName = process.env.PINECONE_INDEX_NAME;
    if (!indexName) {
      throw new Error("PINECONE_INDEX_NAME is not set");
    }
    const index = pinecone.index(indexName);
    const namespace = `${userId}_${agentId}`;

    // Initialize OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    let totalProcessedDocuments = 0;
    const processedDocuments: string[] = [];

    // Process each document
    for (const file of knowledgeBase) {
      try {
        // Update progress
        await supabase
          .from("agents")
          .update({
            creation_progress: {
              state: "creating_vectordb",
              message: `Processing ${file.name}`,
              current: totalProcessedDocuments + 1,
              total: knowledgeBase.length,
              updated_at: new Date().toISOString(),
            },
          })
          .eq("id", agentId);

        // Get appropriate document loader
        const loader = await getDocumentLoader(file, s3Client);

        // Load and split document
        const rawDoc = await loader.load();
        const processedChunks = await processDocument(rawDoc[0], file);

        // Generate embeddings for chunks
        const vectors = await Promise.all(
          processedChunks.map(async (chunk, index) => {
            const vector = await embeddings.embedQuery(chunk.pageContent);
            return {
              id: `${file.name}_${chunk.metadata.chunkIndex}_${Date.now()}`,
              values: vector,
              metadata: {
                ...chunk.metadata,
                vectorId: `${file.name}_${index}_${Date.now()}`,
                embeddingModel: "text-embedding-3-small",
                embeddingTimestamp: Date.now(),
              },
            };
          })
        );

        // Upsert vectors to Pinecone in batches
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
          const batch = vectors.slice(i, i + batchSize);
          await index.upsert(batch);
        }

        processedDocuments.push(file.name);
        totalProcessedDocuments++;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);

        // Update progress with error
        await supabase
          .from("agents")
          .update({
            creation_progress: {
              state: "creating_vectordb",
              error: `Failed to process ${file.name}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              current: totalProcessedDocuments,
              total: knowledgeBase.length,
              updated_at: new Date().toISOString(),
            },
          })
          .eq("id", agentId);

        // Continue with next file
        continue;
      }
    }

    // Prepare return configuration
    const vectorDBConfig = {
      namespace,
      documentCount: totalProcessedDocuments,
      documents: processedDocuments,
      status: "active" as const,
    };

    // Update database with final configuration
    await supabase
      .from("agents")
      .update({
        vector_db: vectorDBConfig,
        creation_progress: {
          state: "updating_config",
          message: "Vector database created successfully",
          current: totalProcessedDocuments,
          total: totalProcessedDocuments,
          updated_at: new Date().toISOString(),
        },
      })
      .eq("id", agentId);

    await updateAgentStatus(agentId, "updating_config");

    return vectorDBConfig;
  } catch (error) {
    console.error("Error creating vector database:", error);
    await updateAgentStatus(agentId, "failed");

    // Update error status in database
    await supabase
      .from("agents")
      .update({
        creation_progress: {
          state: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          updated_at: new Date().toISOString(),
        },
      })
      .eq("id", agentId);

    throw error;
  }
}
