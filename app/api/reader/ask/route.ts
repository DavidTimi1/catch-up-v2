import { NextResponse } from "next/server";
import { GeminiService } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileUrl, mimeType, prompt, highlightRect, highlightType } = body;

    if (!fileUrl || !prompt || !mimeType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (fileUrl, mimeType, prompt)" },
        { status: 400 }
      );
    }

    const ai = new GeminiService();
    const answer = await ai.explainInteraction({
      fileUrl,
      mimeType,
      prompt,
      highlightRect,
      highlightType,
    });

    return NextResponse.json({ success: true, ...answer });
  } catch (error) {
    console.error("Reader Ask API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
