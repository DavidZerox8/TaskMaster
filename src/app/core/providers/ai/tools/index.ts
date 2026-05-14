import { AIToolDefinition } from '../../../../models/ai.model';

export {
  AI_TOOL_CATALOG,
  TOOL_CREATE_HABIT,
  TOOL_ADJUST_HABIT,
  TOOL_ARCHIVE_HABIT,
  TOOL_CREATE_ROUTINE,
  TOOL_COMPLETE_TASK,
  TOOL_ACCEPT_TIME_WINDOW_ADJUSTMENT,
  TOOL_DISMISS_ADAPTIVE_SUGGESTION,
  TOOL_CELEBRATE_STREAK,
} from './tool-schemas';

/**
 * Anthropic Tools API shape:
 * { name, description, input_schema: { type, properties, required } }
 */
export function toAnthropicTools(tools: AIToolDefinition[]): unknown[] {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));
}

/**
 * Gemini Function Calling shape:
 * { functionDeclarations: [{ name, description, parameters: { type, properties, required } }] }
 */
export function toGeminiTools(tools: AIToolDefinition[]): unknown[] {
  return [{
    functionDeclarations: tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: normalizeSchemaForGemini(t.inputSchema),
    })),
  }];
}

/**
 * Gemini espera los tipos en mayusculas ("STRING", "OBJECT"...).
 */
function normalizeSchemaForGemini(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return schema;
  const node = schema as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'type' && typeof value === 'string') {
      result['type'] = value.toUpperCase();
    } else if (key === 'properties' && value && typeof value === 'object') {
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        props[k] = normalizeSchemaForGemini(v);
      }
      result['properties'] = props;
    } else if (key === 'items' && value) {
      result['items'] = normalizeSchemaForGemini(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
