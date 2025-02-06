# AI Agent Database Schema

## Table: agents

### Primary Fields
- `id` (UUID, Primary Key) - Unique identifier for each agent
- `status` (Text) - Current status of the agent
- `vector_db_data` (JSONB) - Pinecone vector database details for AI agent template
- `deployed_link` (Text) - URL where the agent is deployed

### Basic Information
- `user_id` (Text) - Owner of the agent
- `agent_name` (Text) - Name of the agent
- `description` (Text) - Description of the agent's purpose
- `primary_model` (Text) - Primary LLM model (openai/claude/deepseek)
- `fallback_model` (Text) - Fallback LLM model (openai/claude/deepseek)

### Capabilities
- `system_prompt` (Text) - Base system prompt for the agent
- `knowledge_base` (JSONB) - Array of knowledge base files and their metadata
  ```json
  {
    "files": [
      {
        "name": "string",
        "url": "string",
        "type": "string",
        "size": "number"
      }
    ]
  }
  ```

### Appearance
- `agent_icon` (JSONB) - Agent's icon/avatar metadata
  ```json
  {
    "name": "string",
    "url": "string",
    "type": "string"
  }
  ```
- `user_message_color` (Text) - Color for user messages
- `agent_message_color` (Text) - Color for agent messages
- `opening_message` (Text) - Initial greeting message
- `quick_messages` (JSONB) - Array of predefined quick messages

### RAG Configuration
- `vector_db_config` (JSONB) - Pinecone vector database configuration
  ```json
  {
    "index_name": "string",
    "namespace": "string",
    "collection_id": "string",
    "document_count": "number",
    "metadata": {
      "dimension": "number",
      "metric": "string"
    }
  }
  ```
- `document_urls` (JSONB) - Array of processed document URLs for RAG
- `embedding_model` (Text) - Model used for document embeddings

### Creation Progress
- `creation_progress` (JSONB) - Agent creation and deployment status
  ```json
  {
    "state": "string",
    "started_at": "timestamp",
    "updated_at": "timestamp",
    "error": "string"
  }
  ```

### Access Control
- `is_paid` (Boolean) - Whether the agent is a paid version
- `is_public` (Boolean) - Whether the agent is publicly accessible

### Metadata
- `created_at` (Timestamp with timezone) - Creation timestamp
- `updated_at` (Timestamp with timezone) - Last update timestamp

## Notes
1. The `vector_db_data` field stores Pinecone-specific configuration:
   ```json
   {
     "index_name": "string",
     "namespace": "string",
     "metadata": {
       "dimension": "number",
       "metric": "string"
     }
   }
   ```
2. Use appropriate indexes on frequently queried columns (`user_id`, `agent_name`, `status`)
3. Consider adding foreign key constraints for `user_id` if you have a users table
4. All text fields should have appropriate length constraints
