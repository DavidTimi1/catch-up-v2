# Catchup 🚶‍♂️📖

> Skipped classes? I got you. Turn those notes and PDFs into interactive tutoring sessions. 
Built for myself but you can use too, don't mention... we don't do that here 😉 #studysmart

[![EdTech](https://img.shields.io/badge/EdTech-FF6B6B?style=for-the-badge)](#)
[![AI Tutor](https://img.shields.io/badge/AI_Tutor-4ECDC4?style=for-the-badge)](#)
[![Study Assistant](https://img.shields.io/badge/Study_Assistant-45B7D1?style=for-the-badge)](#)
[![PWA](https://img.shields.io/badge/PWA-96CEB4?style=for-the-badge)](#)
[![Multimodal Learning](https://img.shields.io/badge/Multimodal_Learning-FFEEAD?style=for-the-badge&labelColor=333333)](#)

_Dive into the [Raw Thoughts & Origin Story (Notes App Idea)](./NOTE_APP_IDEA.md) that started this project._

## Overview

Reading through raw class notes without a teacher's walkthrough can leave you struggling to understand the "why" behind the material. Catchup is an AI-powered educational Progressive Web Application (PWA) designed to transform static images and PDFs of handwritten notes into an interactive, logically ordered progression. By processing notes into sequenced "Moments," Catchup acts as a personal tutor, revealing information step-by-step with contextual explanations.

## Key Features

* **Intelligent Sequencing:** Upload note images or PDFs, and the AI will logically order them into a teaching progression, establishing preamble knowledge before diving into the main material.
* **The Moment Architecture:** The learning flow is driven by an array of `Moment` objects, each corresponding to a specific conceptual step.
* **Non-Destructive Focus Polygons:** Unrelated or future context on the note image is blocked out using custom SVG obstruction polygons. As you progress, concepts stay revealed.
* **Speech-Like Walkthroughs:** Each `Moment` includes plain-English, speech-like text to explain the currently observable portion of the notes.
* **Integrated & Persistent TTS:** Optional Text-to-Speech captions featuring an auto-play speaker toggle. The TTS engine gracefully handles skipping, pausing, and rapid navigation without overlapping voices.
* **Contextual Deep Dives:** For concepts requiring prerequisite knowledge, "learn more" objects provide extra explanation, complete with titles and links for deeper understanding.
* **Split-View Distraction-Free UI:** A beautiful, dark "Chalkboard Slate" interface that isolates notes on the left and learning controls on the right.
* **Smart Q&A:** A chat-based question feature maintains past context. If your question is about to be answered in an upcoming `Moment`, the AI will prompt you to wait, though a "force answer" option is always available.
* **Collaborative & Infinite Lessons:** Lesson sets are shareable and extendable. You can add new PDFs or images anytime, and the AI will append new `Moment` objects by using the previous context.

## Current Progress & Next Steps

Catchup has rapidly evolved from a proof-of-concept into a robust, offline-capable platform.
* ✅ **Client-Side Media Handling:** Migrated entirely to client-side Cloudinary uploads with unsigned presets, removing server-side file dependencies.
* ✅ **Zero-Latency Caching:** Integrated IndexedDB to locally cache uploaded PDFs and images, enabling instantaneous loading for heavy files.
* ✅ **Native PDF Support:** Fully integrated PDF parsing directly into the Google GenAI `Interactions API`. 
* ✅ **Modular Modals:** A robust, single-source-of-truth global `ModalProvider` handles unified alerts, previews, and upload wizards.
* 🚀 **Upcoming - Interactive Reader Mode:** Converting Catchup into a dual-mode PWA that includes an interactive PDF reader. This mode will feature a "pen tool" for highlighting arbitrary segments of a document to trigger localized AI TTS explanations.

## Tech Stack

* **Framework:** Next.js (React 19)
* **Language:** TypeScript
* **Database & ORM:** SQLite with Drizzle ORM
* **Styling:** Tailwind CSS & Framer Motion
* **AI Engine:** Google Gemini API (`@google/genai` Interactions API)
* **Storage:** Cloudinary (Client-side) & IndexedDB (Local cache)

## System Architecture & Flow

Catchup operates on a state-driven progression model. The core logic relies on breaking down unstructured image/PDF data into a strictly typed array of `Moment` objects.

1. **Ingestion & Processing:** Media files are uploaded to Cloudinary, and the URLs are fed to the Gemini API alongside context. Gemini returns a structured JSON payload of `Moments`.
2. **State Hydration:** Each `Moment` contains the active media URI, the coordinate array for the obstruction polygons, the spoken text, and optional "learn more" metadata.
3. **UI Rendering:** The Next.js frontend acts as a viewport into the current state. It renders the base media, applies SVG `clip-path` masks based on the polygon coordinates to obscure future data, and displays the walkthrough text.

## Getting Started

### Prerequisites

* Node.js 18+
* A Google Gemini API Key
* A Cloudinary Cloud Name & Unsigned Upload Preset

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Catchup.git
```

2. Navigate into the directory and install dependencies:
```bash
cd Catchup
npm install
```

3. Set up your environment variables by creating a `.env.local` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

4. Push the database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Author

**David Uwagbale** (Dev_id)
🌐 [davidtimi.tech](https://davidtimi.tech)