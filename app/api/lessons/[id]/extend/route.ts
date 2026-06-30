import { NextResponse } from "next/server";
import { aiService } from "@/lib/ai";
import { db } from "@/lib/db";
import { lessons, images as imagesTable, moments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withRetry } from "@/lib/utils/retry";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { uploadedFiles } = body;

    if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, id),
      with: {
        images: true,
        moments: {
          orderBy: (moments, { asc }) => [asc(moments.order)],
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const context = lesson.moments
      .map((m, i) => `Step ${i + 1}: ${m.explanation}`)
      .join("\n");

    const urls = uploadedFiles.map((f: { url: string }) => f.url);

    const momentsData = await withRetry(() => aiService.generateMoments(urls, context));

    const result = await db.transaction(async (tx) => {
      const startingImageOrder = lesson.images.length;
      const startingMomentOrder = lesson.moments.length;

      const createdImages = await tx.insert(imagesTable).values(
        uploadedFiles.map((img: { url: string, publicId: string }, index: number) => ({
          id: crypto.randomUUID(),
          url: img.url,
          publicId: img.publicId,
          order: startingImageOrder + index,
          lessonId: lesson.id,
        }))
      ).returning();

      const createdMoments = await tx.insert(moments).values(
        momentsData.map((mData, index) => {
          const dbImage = createdImages.find((img) => img.url === mData.imageId) || createdImages[0];

          return {
            lessonId: lesson.id,
            order: startingMomentOrder + index,
            imageId: dbImage ? dbImage.id : null,
            polygons: JSON.stringify(mData.polygons),
            explanation: mData.explanation,
            extraTitle: mData.extraTitle || null,
            extraBody: mData.extraBody || null,
          };
        })
      ).returning();

      return { momentsAdded: createdMoments.length };
    });

    return NextResponse.json({
      success: true,
      momentsAdded: result.momentsAdded,
    });
  } catch (error: unknown) {
    console.error("Failed to extend lesson:", error);
    return NextResponse.json(
      { error: "Failed to extend lesson", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
