# Agent Creation Implementation Guide

## Overview

This document outlines the implementation plan for the agent creation flow, including status tracking, UI updates, and database integration.

## System Components

### 1. Database Schema

- Table: `agents`
- Key Fields:
  - `agent_id` (text, unique): Format `{agent_name}-{user_id}-{timestamp}`
  - `status` (text): Current creation state
  - Other existing fields...

### 2. Creation States

```typescript
type CreationState =
  | "storing_initial_config"
  | "creating_vectordb"
  | "updating_config"
  | "deploying_agent"
  | "finalizing_agent"
  | "completed"
  | "failed";
```

## Implementation Steps

### Phase 1: Database Status Updates

1. **Create Status Update Function**

```typescript
// lib/agent-creation/utils.ts
async function updateAgentStatus(agentId: string, status: CreationState) {
  const supabase = createClient();
  await supabase.from("agents").update({ status }).eq("agent_id", agentId);
}
```

2. **Update Creation Steps**

```typescript
// In each step file (e.g., store-initial-config.ts)
export async function storeInitialConfig(params: StoreInitialConfigParams) {
  const { agent_id } = params;

  try {
    await updateAgentStatus(agent_id, "storing_initial_config");
    // Perform step logic
    await updateAgentStatus(agent_id, "creating_vectordb"); // Update to next state
    return result;
  } catch (error) {
    await updateAgentStatus(agent_id, "failed");
    throw error;
  }
}
```

### Phase 2: Status API Route

1. **Update Status Route**

```typescript
// app/api/agent/status/[agentId]/route.ts
export async function GET(
  request: Request,
  context: { params: { agentId: string } }
) {
  const { agentId } = context.params;

  const { data, error } = await supabase
    .from("agents")
    .select("status")
    .eq("agent_id", agentId)
    .single();

  // Handle case where entry doesn't exist yet
  if (!data) {
    return NextResponse.json({
      success: true,
      progress: {
        state: "storing_initial_config",
        updated_at: new Date().toISOString(),
      },
    });
  }

  return NextResponse.json({
    success: true,
    progress: {
      state: data.status,
      updated_at: new Date().toISOString(),
    },
  });
}
```

### Phase 3: Create Page Component

1. **Update Create Page**

```typescript
// app/create/page.tsx
const CreatePage = () => {
  const [status, setStatus] = useState<CreationStatus | null>(null);
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");

  useEffect(() => {
    if (!agentId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/agent/status/${agentId}`);
        const data = await response.json();

        setStatus(data.progress);

        if (data.progress.state === "completed") {
          clearInterval(interval);
          // Handle completion
        }
      } catch (error) {
        console.error("Error fetching status:", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [agentId]);

  return (
    <MultiStepLoader
      loadingStates={stateOrder.map((state) => ({
        text: stateMessages[state],
        isComplete: () => {
          // Handle null status (initial state)
          if (!status) {
            return state === "storing_initial_config";
          }

          return (
            status.state === state ||
            stateOrder.indexOf(status.state) > stateOrder.indexOf(state)
          );
        },
      }))}
      loading={!!status && status.state !== "completed"}
    />
  );
};
```

## Testing Plan

### 1. Database Updates

- Verify status updates in database for each step
- Test error cases and failed state
- Verify agent_id format and uniqueness

### 2. Status API

- Test with existing agent_id
- Test with non-existent agent_id
- Verify error handling
- Check response format

### 3. UI Updates

- Verify initial loading state
- Check progress updates
- Test completion state
- Verify error handling
- Test navigation after completion

## Edge Cases to Handle

1. **Initial Database Entry Creation**

   - Show first step even if entry doesn't exist
   - Handle transition smoothly once entry is created

2. **Error States**

   - Database errors
   - Network errors
   - Invalid agent_id

3. **Race Conditions**
   - Multiple status updates
   - Delayed database writes

## Success Criteria

1. ✓ Accurate progress tracking
2. ✓ Smooth UI updates
3. ✓ Proper error handling
4. ✓ No blank/loading states
5. ✓ Correct navigation flow
6. ✓ Database consistency

## Notes

- Poll interval: 1000ms (adjustable based on needs)
- Status updates are atomic
- Error states are properly propagated
- UI always shows something meaningful to the user
