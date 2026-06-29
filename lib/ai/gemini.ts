import { GoogleGenAI } from "@google/genai";
import { IAIService, MomentData, QuestionAnswer, cleanAIJsonData, ReaderInteractionInput, InteractionAnswer } from "./interface";

// Initialize the Google Gen AI SDK
const getAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

export class GeminiService implements IAIService {
  async generateMoments(filePaths: string[], context?: string): Promise<MomentData[]> {
    const fileParts = filePaths.map((fileUrl) => {
        let mime_type = "image/jpeg";
        let type = "image";
        
        if (fileUrl.toLowerCase().endsWith(".png")) mime_type = "image/png";
        else if (fileUrl.toLowerCase().endsWith(".gif")) mime_type = "image/gif";
        else if (fileUrl.toLowerCase().endsWith(".pdf")) {
          mime_type = "application/pdf";
          type = "document";
        }

        return {
          type,
          uri: fileUrl,
          mime_type,
        };
      })

    const prompt = `
      You are an expert tutor guiding a student through a set of handwritten or printed notes.
      I have provided the image(s) of the notes.
      ${context ? `Here is the previous context of the lesson: ${context}` : ""}

      Please analyze the notes and break them down into a logical progression of "Moments".
      A "Moment" represents a single conceptual step in explaining the material.
      
      CRITICAL RULES:
      1. KNOWLEDGE CHUNKING: Do not break the notes down into trivial, line-by-line atomic moments. Instead, group related steps, equations, or logical blocks into meaningful knowledge progression chunks. Provide extra explanation moments where concepts get complex.
      2. NON-DESTRUCTIVE MASKING: You must NEVER obscure parts of the notes that have ALREADY been explained in previous moments. Once a concept is revealed, it stays revealed for the rest of the lesson. The masking polygons should ONLY cover future content that has NOT YET been discussed.
      3. CONVERSATIONAL TTS TEXT: The "explanation" field will be read aloud to the user via Text-to-Speech while they look at the note. It must sound like a real teacher talking. DO NOT read out massive math formulas symbol-for-symbol. Instead, refer to them conceptually (e.g. "As you can see in this new transformed matrix..." or "Notice how the quadratic formula simplifies here...").
      4. CONCISE EXPLANATIONS: Keep your explanations STRICTLY scoped to the current moment. Do NOT ramble, over-explain, or add unnecessary tangential fluff. Be direct, concise, and highly relevant only to the currently revealed/highlighted segment of the notes.
      5. HIGHLIGHT MARKER (Optional): If you are talking about a specific part of the currently visible note and want to draw the user's attention to it (e.g., underlining a variable or circling an equation), provide a list of lines/strokes in the "highlightLines" field. Do not overuse this.

      For each Moment, you must output:
      1. polygons: An array of obstruction polygons. Each polygon is an array of points {x, y} (where x and y are purely numerical values from 0 to 100 representing relative percentages of the image width/height). DO NOT include "%" signs. e.g. {"x": 50.5, "y": 25.0}. These polygons should ONLY cover FUTURE content.
      2. highlightLines: (Optional) An array of strokes. Each stroke is an array of points {x, y} (0 to 100) representing a continuous drawn line over the image to highlight what you are talking about. e.g. [[{x: 10, y: 10}, {x: 20, y: 10}]].
      3. explanation: A natural, speech-like conversational english explanation of the current concept.
      4. extraTitle: (Optional) If preamble or previous knowledge is required to understand this moment, provide a short title.
      5. extraBody: (Optional) The detailed explanation of that preamble or extra knowledge.

      Return the result STRICTLY as a JSON array of Moment objects EXACTLY as shown in the format below.
      type Polygon = Array<{x: number, y: number}>
      type Stroke = Array<{x: number, y: number}>
      [
        {
          "polygons": [
            [{"x": 10, "y": 50}, {"x": 90, "y": 50}, {"x": 90, "y": 100}, {"x": 10, "y": 100}]
          ],
          "highlightLines": [
            [{"x": 15, "y": 20}, {"x": 30, "y": 20}]
          ],
          "explanation": "Let's start by looking at this first equation...",
          "extraTitle": "Remembering the quadratic formula",
          "extraBody": "The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a"
        }
      ]
    `;

    const ai = getAI();
    const response = await ai.interactions.create({
      model: "gemini-2.5-flash",
      input: [
        { type: "text", text: prompt },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...fileParts as any[]
      ],
    });

    const responseText = response.output_text || "[]";
    const cleanedJson = cleanAIJsonData(responseText);

    try {
      const moments: MomentData[] = JSON.parse(cleanedJson);
      // Let's attach the first imageId if not provided (this logic will be refined when we handle multiple images robustly)
      return moments.map((m) => ({
        ...m,
        imageId: filePaths[0], // temporary fallback
      }));
    } catch {
      console.error("Failed to parse Gemini JSON:", cleanedJson);
      throw new Error("Failed to generate valid moments from AI.");
    }
  }

  async answerQuestion(question: string, context: string): Promise<QuestionAnswer> {
    const prompt = `
      You are an expert tutor.
      Here is the current context of the lesson:
      ${context}

      The student asks: "${question}"

      If the answer to the student's question will naturally be covered later in the notes/context, set "isDeferred" to true and provide a reassuring "answer" that tells them they will realize why in a bit.
      Otherwise, set "isDeferred" to false and provide the direct "answer".

      Return strictly JSON:
      {
        "answer": "string",
        "isDeferred": boolean
      }
    `;

    const ai = getAI();
    const response = await ai.interactions.create({
      model: "gemini-2.5-flash",
      input: prompt,
    });

    const responseText = response.output_text || "{}";
    const cleanedJson = cleanAIJsonData(responseText);

    try {
      return JSON.parse(cleanedJson) as QuestionAnswer;
    } catch {
      console.error("Failed to parse Gemini JSON:", cleanedJson);
      throw new Error("Failed to generate valid answer from AI.");
    }
  }

  async explainInteraction(input: ReaderInteractionInput): Promise<InteractionAnswer> {
    const ai = getAI();
    let type = "image";
    if (input.mimeType === "application/pdf") {
      type = "document";
    }

    let spatialContext = "The user has highlighted the entire page.";
    if (input.highlightType !== 'full-page' && input.highlightRect) {
      spatialContext = `The user has highlighted a specific region on the document using a ${input.highlightType}. The bounding box coordinates relative to the visible canvas are: X=${input.highlightRect.x}, Y=${input.highlightRect.y}, Width=${input.highlightRect.width}, Height=${input.highlightRect.height}. Focus your explanation specifically on the contents within or near this region.`;
    }

    const systemInstruction = `
      You are an expert tutor answering a student's question based on a document or image they are viewing.
      ${spatialContext}
      
      The student's prompt is: "${input.prompt}"

      Provide a clear, conversational, and direct explanation. Do not ramble.
      
      You must return your response strictly as a JSON object with two fields:
      1. "readableAnswer": A beautifully formatted human-readable explanation (using markdown if necessary) for the UI.
      2. "ttsAnswer": An optimized version of the explanation to be read aloud by Text-to-Speech. In this version, drop complex symbols, equations, or formatting that cannot be spoken naturally. Write it exactly as a teacher would speak it.

      Example output:
      {
        "readableAnswer": "The formula for the area of a circle is **A = πr²**.",
        "ttsAnswer": "The formula for the area of a circle is A equals pi r squared."
      }
    `;

    const response = await ai.interactions.create({
      model: "gemini-2.5-flash",
      input: [
        { type: "text", text: systemInstruction },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { type: type, uri: input.fileUrl, mime_type: input.mimeType } as any
      ]
    });

    const responseText = response.output_text || "{}";
    const cleanedJson = cleanAIJsonData(responseText);

    try {
      return JSON.parse(cleanedJson) as InteractionAnswer;
    } catch {
      console.error("Failed to parse Gemini JSON:", cleanedJson);
      throw new Error("Failed to generate valid explanation from AI.");
    }
  }
}
