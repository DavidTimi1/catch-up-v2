import { NextResponse } from "next/server";
import { aiService } from "@/lib/ai";
import { db } from "@/lib/db";
import { lessons, images as imagesTable, moments } from "@/lib/db/schema";
import { withRetry } from "@/lib/utils/retry";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, uploadedFiles } = body; // uploadedFiles: { url: string, publicId: string }[]

    if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const lessonId = crypto.randomUUID();
    const urls = uploadedFiles.map((f: { url: string }) => f.url);

    // Concurrent Upload to Cloudinary was removed. We just do AI Generation
    const momentsData = await withRetry(() => aiService.generateMoments(urls));

    // Save to Database using Drizzle
    const result = await db.transaction(async (tx) => {
      const [lesson] = await tx.insert(lessons).values({
        id: lessonId,
        title: title || "New Note Walkthrough",
      }).returning();

      const createdImages = await tx.insert(imagesTable).values(
        uploadedFiles.map((img: { url: string, publicId: string }, index: number) => ({
          id: crypto.randomUUID(),
          url: img.url,
          publicId: img.publicId,
          order: index,
          lessonId: lesson.id,
        }))
      ).returning();

      const createdMoments = await tx.insert(moments).values(
        momentsData.map((mData, index) => {
          const dbImage = createdImages.find((img) => img.url === mData.imageId) || createdImages[0];

          return {
            lessonId: lesson.id,
            order: index,
            imageId: dbImage ? dbImage.id : null,
            polygons: JSON.stringify(mData.polygons),
            explanation: mData.explanation,
            extraTitle: mData.extraTitle || null,
            extraBody: mData.extraBody || null,
          };
        })
      ).returning();

      return { lessonId: lesson.id, momentsCount: createdMoments.length };
    });

    return NextResponse.json({
      success: true,
      lessonId: result.lessonId,
      momentsCount: result.momentsCount,
    });
  } catch (error: unknown) {
    console.error("Failed to create lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
