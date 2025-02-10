import { createClient } from "@/utils/supabase/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/lib/utils/logger";

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
  // Log AWS configuration state
  logger.debug("Initializing S3 client with config:", {
    region: process.env.AWS_REGION ? "Set" : "Missing",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ? "Set" : "Missing",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Missing",
    bucketName: process.env.AWS_S3_BUCKET_NAME ? "Set" : "Missing",
  });

  if (
    !process.env.AWS_REGION ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    logger.error("Missing required AWS credentials:", {
      region: !process.env.AWS_REGION ? "Missing" : "Set",
      accessKeyId: !process.env.AWS_ACCESS_KEY_ID ? "Missing" : "Set",
      secretAccessKey: !process.env.AWS_SECRET_ACCESS_KEY ? "Missing" : "Set",
    });
    throw new Error("Missing required AWS credentials");
  }

  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

// Get appropriate document loader based on file type
async function getDocumentLoader(file: KnowledgeBaseFile, s3Client: S3Client) {
  logger.info(`Getting document loader for file: ${file.name}`);
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  logger.debug("File extension:", fileExtension);

  const url = new URL(file.url);
  logger.debug("Full URL:", url);
  // Extract the key from the full URL and decode URL-encoded characters
  const key = decodeURIComponent(url.pathname.substring(1));
  logger.debug("Extracted S3 key:", key);

  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  });

  try {
    logger.info(`Attempting to fetch file from S3:`, {
      bucket: process.env.AWS_S3_BUCKET_NAME,
      key: key,
      fileExtension,
    });

    // Get file from S3
    const response = await s3Client.send(getObjectCommand);
    const buffer = await response.Body?.transformToByteArray();

    if (!buffer) {
      const error = new Error("Failed to get file content from S3");
      logger.error(`No buffer received for file:`, {
        key,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        responseMetadata: response.$metadata,
      });
      throw error;
    }

    logger.info(`Successfully fetched file from S3:`, {
      key,
      size: buffer.length,
      metadata: response.$metadata,
    });

    switch (fileExtension) {
      case "pdf":
        logger.debug("Creating PDF loader");
        return new PDFLoader(new Blob([buffer], { type: "application/pdf" }), {
          splitPages: false,
        });
      case "csv":
        logger.debug("Creating CSV loader");
        const csvText = new TextDecoder().decode(buffer);
        return new CSVLoader(new Blob([csvText], { type: "text/csv" }));
      default:
        logger.debug("Creating default text loader");
        const text = new TextDecoder().decode(buffer);
        return new TextLoader(new Blob([text], { type: "text/plain" }));
    }
  } catch (error) {
    // Enhanced error logging
    logger.error("Error loading file from S3:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      requestDetails: {
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key,
        fileExtension,
      },
      awsConfig: {
        region: process.env.AWS_REGION ? "Set" : "Missing",
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ? "Set" : "Missing",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Missing",
      },
    });
    throw error;
  }
}

// Process document into chunks with metadata
async function processDocument(doc: Document, file: KnowledgeBaseFile) {
  logger.info(`Processing document: ${file.name}`);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  logger.debug("Splitting document into chunks");
  const chunks = await splitter.splitDocuments([doc]);
  logger.info(`Created ${chunks.length} chunks from document`);

  return chunks.map((chunk, index) => {
    const processedChunk = {
      pageContent: chunk.pageContent,
      metadata: {
        source: file.name,
        fileType: file.type,
        chunkIndex: index,
        timestamp: Date.now(),
        charCount: chunk.pageContent.length,
        tokenCount: Math.ceil(chunk.pageContent.length / 4),
        documentId: `${file.name}_${Date.now()}`,
        ...Object.entries(chunk.metadata).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: typeof value === "object" ? JSON.stringify(value) : value,
          }),
          {}
        ),
      },
    };
    logger.debug(`Processed chunk ${index + 1}/${chunks.length}`, {
      chunkSize: processedChunk.pageContent.length,
      metadata: processedChunk.metadata,
    });
    return processedChunk;
  });
}

// Main vector database creation function
export async function createVectorDB({
  agentId,
  userId,
  knowledgeBase,
}: CreateVectorDBParams): Promise<VectorDBConfig | null> {
  const logFile = logger.initializeLog(agentId);
  logger.info("Starting vector DB creation", { agentId, userId });
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
      logger.info("No knowledge base provided, creating empty config");
      const config = {
        namespace: `${userId}_${agentId}`,
        documentCount: 0,
        documents: [],
        status: "no_knowledge_base" as const,
      };

      await supabase
        .from("agents")
        .update({
          vector_db_config: config,
          vector_db_data: config,
          creation_progress: {
            state: "creating_vectordb",
            message: "No knowledge base provided",
            updated_at: new Date().toISOString(),
          },
        })
        .eq("agent_id", agentId);

      return config;
    }

    const indexName = process.env.PINECONE_INDEX_NAME;
    if (!indexName) {
      logger.error("PINECONE_INDEX_NAME environment variable not set");
      throw new Error("PINECONE_INDEX_NAME is not set");
    }
    const index = pinecone.index(indexName);
    const namespace = `${userId}_${agentId}`;

    const initialStats = await index.describeIndexStats();
    logger.info("Initial index stats:", {
      totalRecordCount: initialStats.totalRecordCount,
      existingNamespaces: initialStats.namespaces
        ? Object.keys(initialStats.namespaces)
        : [],
    });

    // Initialize OpenAI embeddings
    logger.debug("Initializing OpenAI embeddings");
    const embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    let totalProcessedDocuments = 0;
    const processedDocuments: string[] = [];

    // Process each document
    for (const file of knowledgeBase) {
      try {
        logger.info(`Processing file: ${file.name}`);
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
        logger.debug("Loading document content");
        const docs = await loader.load();
        logger.info(`Loaded document with ${docs.length} pages/sections`);

        // Process the document into chunks
        logger.debug("Processing document chunks");
        const processedChunks = await processDocument(docs[0], file);
        logger.info(`Created ${processedChunks.length} chunks for processing`);

        // Generate embeddings and upsert to Pinecone
        logger.debug("Generating embeddings for chunks");
        const vectors = await Promise.all(
          processedChunks.map(async (chunk, i) => {
            const embedding = await embeddings.embedQuery(chunk.pageContent);
            logger.debug(
              `Generated embedding for chunk ${i + 1}/${processedChunks.length}`
            );
            return {
              id: `${file.name}_${i}_${Date.now()}`,
              values: embedding,
              metadata: chunk.metadata,
            };
          })
        );
        logger.info(`Upserting ${vectors.length} vectors to Pinecone`);
        // Upsert vectors in batches to avoid rate limits
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
          const batch = vectors.slice(i, i + batchSize);
          try {
            logger.info(
              `Uploading batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
                vectors.length / batchSize
              )}`,
              {
                start: i,
                end: Math.min(i + batchSize, vectors.length),
                namespace,
                vectorCount: batch.length,
              }
            );

            // Call upsert with the namespace
            await index.namespace(namespace).upsert(batch);

            logger.info(
              `Successfully uploaded batch ${Math.floor(i / batchSize) + 1}`
            );
          } catch (error) {
            logger.error(`Error uploading batch to Pinecone:`, {
              error:
                error instanceof Error
                  ? {
                      name: error.name,
                      message: error.message,
                      stack: error.stack,
                    }
                  : error,
              batchDetails: {
                batchNumber: Math.floor(i / batchSize) + 1,
                vectorCount: batch.length,
                namespace,
              },
            });
            throw error;
          }
        }

        processedDocuments.push(file.name);
        totalProcessedDocuments++;
      } catch (error) {
        logger.error(`Error processing file ${file.name}:`, error);
        throw error;
      }
    }

    // Add namespace verification before preparing return config
    if (totalProcessedDocuments > 0) {
      const finalStats = await index.describeIndexStats();
      logger.info("Final index stats:", {
        namespace,
        namespaceStats: finalStats.namespaces?.[namespace],
        allNamespaces: finalStats.namespaces
          ? Object.keys(finalStats.namespaces)
          : [],
        totalRecordCount: finalStats.totalRecordCount,
      });

      // [INFO] : Okay. So the thing is the namespace does get created, but it takes time for it to reflect. So rather than putting in a delay here, so as to wait for the index creation, because it just calls or cheques it even before the creation process, like it takes a small delay. So I am removing this part, but if it needs to be checked, we will add some delay and maybe cheque it
      // if (!finalStats.namespaces?.[namespace]) {
      //   const error = new Error(
      //     `Namespace ${namespace} was not created successfully`
      //   );
      //   logger.error("Namespace creation failed:", {
      //     expectedNamespace: namespace,
      //     existingNamespaces: finalStats.namespaces
      //       ? Object.keys(finalStats.namespaces)
      //       : [],
      //   });
      //   throw error;
      // }
    }

    // Prepare return configuration
    const vectorDBConfig = {
      namespace,
      documentCount: totalProcessedDocuments,
      documents: processedDocuments,
      status: "active" as const,
    };

    // Update database with final configuration
    const { data, error } = await supabase
      .from("agents")
      .update({
        vector_db_config: vectorDBConfig,
        vector_db_data: vectorDBConfig,
        creation_progress: {
          state: "updating_config",
          message: "Vector database created successfully",
          current: totalProcessedDocuments,
          total: totalProcessedDocuments,
          updated_at: new Date().toISOString(),
        },
      })
      .eq("agent_id", agentId);

    if (error) {
      logger.error("Error updating Supabase:", {
        error,
        agentId,
        vectorDBConfig,
      });
      throw new Error(`Failed to update agent configuration: ${error.message}`);
    }

    logger.info("Successfully updated agent configuration:", {
      agentId,
      data,
      vectorDBConfig,
    });

    await updateAgentStatus(agentId, "updating_config");

    logger.info("Vector DB creation completed successfully", vectorDBConfig);
    return vectorDBConfig;
  } catch (error) {
    logger.error("Error creating vector database:", error);
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
