import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/db/schema';
import "dotenv/config";
import crypto from "crypto";

const runSeed = async () => {
  const pgUrl = process.env.DATABASE_URL || "postgres://myuser:mypassword@localhost:5432/testdb";
  
  console.log(`⏳ Connecting to database at ${pgUrl}...`);
  const queryClient = postgres(pgUrl);
  const db = drizzle(queryClient, { schema });

  console.log("⏳ Seeding database with initial data...");

  // Insert a dummy lesson
  const lessonId = crypto.randomUUID();
  await db.insert(schema.lessons).values({
    id: lessonId,
    title: "Intro to Mathematics - Seeded Walkthrough",
  });

  console.log("✅ Inserted dummy lesson");

  // Insert a dummy image
  const imageId1 = crypto.randomUUID();
  await db.insert(schema.images).values([
    {
      id: imageId1,
      url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      publicId: "sample_public_id",
      lessonId: lessonId,
      order: 0,
    }
  ]);

  console.log("✅ Inserted dummy images");

  // Insert a dummy moment attached to the image
  await db.insert(schema.moments).values([
    {
      id: crypto.randomUUID(),
      lessonId: lessonId,
      order: 0,
      imageId: imageId1,
      polygons: JSON.stringify([{ x: 0.1, y: 0.1, width: 0.8, height: 0.8, type: 'box' }]),
      explanation: "This is an auto-generated sample walkthrough. Here you would see the first step of the notes explained.",
      extraTitle: "Welcome to Catchup",
      extraBody: "You can start interacting with this note, ask questions using the TTS system, or upload your own notes from the home page.",
    }
  ]);

  console.log("✅ Inserted dummy moments");
  console.log("🎉 Database seeded successfully!");

  await queryClient.end();
};

runSeed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
