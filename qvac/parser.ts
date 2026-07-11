import { loadModel, completion, unloadModel, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";
import { ExpenseIntent } from "../shared-types/types";
import { SYSTEM_PROMPT, FEW_SHOT_HISTORY } from "./prompts";

/**
 * Extracts a JSON substring from a text block.
 * Handles markdown code blocks (e.g. ```json ... ```) or finds the first '{' and last '}'.
 */
function extractJSON(text: string): string {
  // Match content in ```json ... ```
  const markdownJsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (markdownJsonMatch && markdownJsonMatch[1]) {
    return markdownJsonMatch[1].trim();
  }

  // Match content in generic ``` ... ```
  const markdownGenericMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (markdownGenericMatch && markdownGenericMatch[1]) {
    return markdownGenericMatch[1].trim();
  }

  // Find boundaries of the JSON object
  const startIdx = text.indexOf("{");
  const endIdx = text.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.substring(startIdx, endIdx + 1).trim();
  }

  return text.trim();
}

/**
 * Parses a raw natural language command using local on-device LLM inference
 * and returns a structured ExpenseIntent.
 *
 * @param userInput The raw natural language input string.
 * @throws Error if validation fails or LLM inference fails.
 */
export async function parseIntent(userInput: string): Promise<ExpenseIntent> {
  if (!userInput || userInput.trim() === "") {
    throw new Error("User input cannot be empty.");
  }

  let modelId: string | null = null;
  try {
    // 1. Load the model on-device
    modelId = await loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
      modelType: "llm",
    });

    // 2. Perform offline local inference
    const result = completion({
      modelId,
      history: [
        { role: "system", content: SYSTEM_PROMPT },
        ...FEW_SHOT_HISTORY,
        { role: "user", content: userInput }
      ],
      stream: true,
    });

    let generatedText = "";
    for await (const token of result.tokenStream) {
      generatedText += token;
    }

    // 3. Extract and parse the JSON response
    const jsonStr = extractJSON(generatedText);
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      throw new Error(`Failed to parse LLM response as JSON. Raw response: "${generatedText}"`);
    }

    // 4. Validate and construct the final ExpenseIntent object
    const validActions = ["reserve", "spend", "cancel"];
    if (!parsed.action || !validActions.includes(parsed.action)) {
      throw new Error(`Invalid action: "${parsed.action}". Must be one of: ${validActions.join(", ")}`);
    }

    // Missing amount = reject with error
    if (parsed.amount === undefined || parsed.amount === null) {
      throw new Error("Transaction amount is missing. Please specify a value in USDt.");
    }

    const amountNum = Number(parsed.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error(`Invalid transaction amount: "${parsed.amount}". Amount must be a positive number.`);
    }

    // Missing deadline = null
    const deadline = parsed.deadline || null;

    // Default category fallback = "other"
    const category = parsed.category || "other";

    const label = parsed.label || userInput.trim();

    const intent: ExpenseIntent = {
      action: parsed.action,
      amount: amountNum,
      currency: "USDt",
      label: label,
      category: category,
      deadline: deadline
    };

    return intent;
  } finally {
    // Always unload the model to free mobile memory
    if (modelId) {
      try {
        await unloadModel({ modelId });
      } catch (err) {
        console.error("Failed to unload QVAC model:", err);
      }
    }
  }
}
