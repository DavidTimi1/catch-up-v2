> *"Most great inventions are born from man's laziness"*  
> — **David, 2026**

So I was reading notes from when I didn't come to class, specifically math notes. I was crash studying for a test that was coming up and I really didn't know anything in the course except the title. So I got a coursemate's notes and took pictures *(ikr normal)*.

I was trying to understand the notes using AI and I realized I was basically repeating an action over and over again. Had to pause on the reading and put this idea down so I didn't forget since it was a pretty nice idea for a web app... yeah not another one but hear me out.

> *"Great engineers end up spending hours for 5 seconds optimization of a task"*  
> — **David, 2026**

## The Core Problem

Basically, I noticed now the notes indicate the flow, but then going over the notes yourself without a teacher or walkthrough isn't really great—you miss or fail to understand the *why* of a lot of things in the note.

## The Solution: AI-Powered Walkthroughs? YES.

So you drop the pics of the notes that you have and then the AI will order them right. Not that this is a single step, nope. It will basically take them 5 at a time and it will generate an array or a **progression** that a teacher will take: from an introduction / just a short explanation why we care about the point where we are starting from, and possibly talk about some preamble knowledge briefly, just before it jumps right into the first / beginning of the main material you gave it.

### The "Moment" Architecture

So yeah, I was talking about the progression, it will be a list of `Moment` objects.

Each moment will contain:
* **Image ID:** An optional image id of the image we are currently referencing or the student should look at from the images that were uploaded.
* **Obstruction Polygons:** The purpose of this is to block out unrelated or not-yet-touched context from that image. You know, typically in the class you will not be able to see what the lecturer hasn't talked about yet until that is written. But then again, it should be a polygon and not a normal square because sometimes students divide their notes and jot in edges, so we want to show and talk about relevant jottings where necessary while blocking out every other thing.
* **Speech-Like Explanation:** A text of explanation that talks in plain, speech-like English, walking through the current observable / now-observable portion of the note.
* **Deep-Dive Knowledge:** A text of extra explanation knowledge that will be useful context for that particular concept that is being explained. This is primarily because some things are meant to have been done in preceding courses yet the student might need to jog his or her memory. In fact, this should be an object with a title and then the extra so that we can show like a *"learn more of [title]"* and when that is clicked, we can then show the body of the extra with links / buttons for more explanation if necessary.

## The Interface & UX

Yeah so the interface should be **low distraction**, core actions type with arrow buttons or tapping extreme edges for next/back. 

We will like to use **TTS** when necessary for the notes, but then the text should also just show like captions with a button like a speaker that turns on TTS. We will like that this preference be noted locally. 

Then there will definitely be a place for **questions**. If that question will potentially be answered (or the answer to that question will be talked about soon enough), it can just show that the person will realize why in a bit, but an option to *force answer* or answer now should also be provided.

Then each lesson set should be extendable and shareable so a user should be able to extend or share a lesson with friends who can later add more images that will be processed and broken down into many more `Moment` objects that will be added to the list. So this indicates we will be using like a chat feature in querying our AI so that it can have past context.

## Handling PDFs

So now I realized that we currently don't support PDFs, and PDFs can be really large and may not fit correctly into what we have. I am not exactly sure how AI sees PDFs—if it sees it as a collection of images or what—but we will have to figure out the best way to handle that. 

So we will allow a user to select a PDF and we will need to have a PDF preview for that that works without uploading the PDF at all.

---

## 🚀 NEW: Architecture Shifts

Hmm, now based on the fact that before we had to upload the files and images to our backend and that then uploaded it to Cloudinary and Gemini, we will be moving away from that to using **client-side Cloudinary uploads**. This also works for PDFs and Gemini also accepts file URIs so we will be using an upload preset instead, and we will not even have to use tmp storage.

So we first upload the files and then pass the URLs to our backend. We will have an upload limit of `10mb` for all the things to be uploaded at once.

---

## 📱 Phase 2: The Progressive Web App & Interactive Reader

**NOW LET'S CREATE ANOTHER VERSION OF THIS APP**, making it a progressive web app (PWA). I originally thought about React Native, but a fully progressive web app is the way to go—might even turn it into a TWA (Trusted Web Activity) later, but for now let's stick to PWA.

The core idea is basically your gallery but waiting for you to ask a question. So when you highlight something on the PDF or image, a textbox pops up for you to type what you want to ask, or for you to just say it—I believe Gemini can take audio input too.

These will not need "Moments" like the Walkthrough app. Each interaction will be stored separately and linked to a particular file ID or hash. I am not exactly sure how we will generate that hash, especially how we handle selecting something on one page and then another thing on another page... idempotency! Oh, we can just make sure we keep track of these things locally.

**IndexedDB** will be heavily used to make sure the entire files are stored in "bundles" or "notebooks" (I'm not too sure of the terminology yet). You can add more things to the notebook/bundle and view all of them, and all this is happening locally. The only time the backend is hit is for questioning and getting responses—that is when we trigger a client-side upload and pass the context.

Then about the prompt field: it will have a preset text "Explain". It will look like a button, but this is just for the user to avoid typing altogether. There will still be a send button, but the "Explain" button will basically just trigger the action without any extra text.

So it is best as a guide and not a full-on tutor.  
*All of a sudden I am getting the urge to convert these 2 projects into 1 web app...*

---

## ✅ IMPLEMENTED ENHANCEMENTS

As the platform evolved, several premium features were implemented to ensure the highest quality study environment:

1. **Split-View Distraction-Free Layout:** The UI was refactored from an obtrusive overlay to a clean split-pane design. The actual notes are cleanly presented on the left, while the captions, controls, and Q&A stay strictly in a dedicated right sidebar.
2. **Advanced Persistent TTS:** The text-to-speech doesn't just read—it remembers your preference. Hitting "play" allows it to auto-play continuously as you navigate through moments, automatically cutting out old audio and starting the new one without manual clicking.
3. **Conversational AI Parsing:** The AI tutor is instructed to act conversationally, avoiding spelling out huge math symbols rigidly. It also chunks knowledge logically rather than line-by-line, providing a much more human-like teaching progression.
4. **Non-Destructive Masking & Highlight Marker:** The masking system was updated so that once a concept is revealed, it stays visible, allowing the student to see the progression. Additionally, a dynamic "Highlight Marker" (SVG path) can animate over specific equations or notes the AI is currently talking about.
5. **Infinite Lesson Extension:** Users can continuously add more pages to an existing lesson. The backend automatically fetches the conversational context from the previous moments so the AI can pick right up where it left off.
6. **Premium Dark Mode:** Implemented a tailored "Chalkboard/Dark Slate" theme that preserves the textured dot-matrix background, avoiding cheap glassmorphism for a more focused, tactile mathematical aesthetic.




What about not having those particular notebook/pdf in your own device
And then being able to publish a notebook / share one with others
Or having a link to a google drive or something and we are able to crawl that ot be displayed: not that it will all be downloaded at once, rather we can just view things on need and then the user can read/see it and then it will be business as usual - when the pdf/image has been pulled before we can store it locally / have a local map by its url.


when a pdf is uploaded and no notebook title has been given, let it take the name of the pdf