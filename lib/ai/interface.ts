export interface PolygonPoint {
  x: number;
  y: number;
}

export interface ExtraKnowledge {
  title: string;
  body: string;
}

export interface MomentData {
  imageId?: string; // We might not have this from the AI directly, but we map it
  polygons: PolygonPoint[][];
  highlightLines?: PolygonPoint[][];
  explanation: string;
  extraTitle?: string;
  extraBody?: string;
}

export interface QuestionAnswer {
  readableAnswer: string;
  ttsAnswer: string;
  isDeferred: boolean;
}

export interface InteractionAnswer {
  readableAnswer: string;
  ttsAnswer: string;
}

export interface ReaderInteractionInput {
  fileUrl: string;
  mimeType: string;
  prompt: string;
  highlightRect?: { x: number; y: number; width: number; height: number };
  highlightType?: 'free-form' | 'box' | 'full-page';
}

export interface IAIService {
  generateMoments(imageUrls: string[], context?: string): Promise<MomentData[]>;
  answerQuestion(question: string, context: string): Promise<QuestionAnswer>;
  explainInteraction(input: ReaderInteractionInput): Promise<InteractionAnswer>;
}

/**
 * Utility function for cleaning up the JSON data gotten from the AI model.
 * Models often wrap JSON in markdown block ticks like ```json ... ```
 */
export function cleanAIJsonData(responseText: string): string {
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}
