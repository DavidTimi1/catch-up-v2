import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Notebook {
  id: string;
  title: string;
  createdAt: number;
  lastOpenedAt?: number;
}

export interface ReaderPage {
  id: string;
  notebookId: string;
  fileBlob: Blob;
  mimeType: string;
  order: number;
  originalUrl?: string; // Cached URL after client-side upload
}

export interface Interaction {
  id: string;
  pageId: string;
  highlightRect: { x: number; y: number; width: number; height: number; type: 'free-form' | 'box' | 'full-page' };
  prompt: string;
  readableAnswer: string;
  ttsAnswer?: string;
  isAudio: boolean;
  createdAt: number;
}

interface ReaderDB extends DBSchema {
  notebooks: {
    key: string;
    value: Notebook;
  };
  pages: {
    key: string;
    value: ReaderPage;
    indexes: { 'by-notebook': string };
  };
  interactions: {
    key: string;
    value: Interaction;
    indexes: { 'by-page': string };
  };
}

const DB_NAME = 'CatchupReaderDB';

export async function initReaderDB(): Promise<IDBPDatabase<ReaderDB>> {
  return openDB<ReaderDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('notebooks')) {
        db.createObjectStore('notebooks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pages')) {
        const pageStore = db.createObjectStore('pages', { keyPath: 'id' });
        pageStore.createIndex('by-notebook', 'notebookId');
      }
      if (!db.objectStoreNames.contains('interactions')) {
        const interactionStore = db.createObjectStore('interactions', { keyPath: 'id' });
        interactionStore.createIndex('by-page', 'pageId');
      }
    },
  });
}

// Notebook operations
export async function createNotebook(title: string): Promise<string> {
  const db = await initReaderDB();
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.put('notebooks', { id, title, createdAt: now, lastOpenedAt: now });
  return id;
}

export async function getNotebooks(): Promise<Notebook[]> {
  const db = await initReaderDB();
  const notebooks = await db.getAll('notebooks');
  return notebooks.sort((a, b) => b.createdAt - a.createdAt); // newest first
}

export async function getNotebook(id: string): Promise<Notebook | undefined> {
  const db = await initReaderDB();
  return db.get('notebooks', id);
}

export async function updateLastOpened(id: string): Promise<void> {
  const db = await initReaderDB();
  const notebook = await db.get('notebooks', id);
  if (notebook) {
    notebook.lastOpenedAt = Date.now();
    await db.put('notebooks', notebook);
  }
}

export async function updateNotebookTitle(id: string, title: string): Promise<void> {
  const db = await initReaderDB();
  const notebook = await db.get('notebooks', id);
  if (notebook) {
    notebook.title = title.trim();
    await db.put('notebooks', notebook);
  }
}

export async function deleteNotebook(id: string): Promise<void> {
  const db = await initReaderDB();
  const tx = db.transaction(['notebooks', 'pages', 'interactions'], 'readwrite');

  // Delete the notebook
  await tx.objectStore('notebooks').delete(id);

  // Delete associated pages and their interactions
  const pageStore = tx.objectStore('pages');
  const index = pageStore.index('by-notebook');
  const pages = await index.getAll(id);

  for (const page of pages) {
    await pageStore.delete(page.id);

    // We can also delete interactions manually or rely on the logic ignoring orphaned interactions
    // For completeness, we delete them:
    const interactionStore = tx.objectStore('interactions');
    const intIndex = interactionStore.index('by-page');
    const interactions = await intIndex.getAll(page.id);
    for (const inter of interactions) {
      await interactionStore.delete(inter.id);
    }
  }

  await tx.done;
}

// Page operations
export async function addPage(notebookId: string, fileBlob: Blob, mimeType: string, order: number, originalUrl?: string): Promise<string> {
  const db = await initReaderDB();
  const id = crypto.randomUUID();
  await db.put('pages', { id, notebookId, fileBlob, mimeType, order, originalUrl });
  return id;
}

export async function getPagesByNotebook(notebookId: string): Promise<ReaderPage[]> {
  const db = await initReaderDB();
  const pages = await db.getAllFromIndex('pages', 'by-notebook', notebookId);
  return pages.sort((a, b) => a.order - b.order);
}

export async function getPage(id: string): Promise<ReaderPage | undefined> {
  const db = await initReaderDB();
  return db.get('pages', id);
}

export async function updatePageUrl(id: string, url: string): Promise<void> {
  const db = await initReaderDB();
  const page = await db.get('pages', id);
  if (page) {
    page.originalUrl = url;
    await db.put('pages', page);
  }
}

// Interaction operations
export async function addInteraction(interaction: Omit<Interaction, 'id' | 'createdAt'>): Promise<string> {
  const db = await initReaderDB();
  const id = crypto.randomUUID();
  await db.put('interactions', { ...interaction, id, createdAt: Date.now() });
  return id;
}

export async function getInteractionsByPage(pageId: string): Promise<Interaction[]> {
  const db = await initReaderDB();
  const interactions = await db.getAllFromIndex('interactions', 'by-page', pageId);
  return interactions.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getInteractionsByNotebook(notebookId: string): Promise<(Interaction & { pageOrder: number })[]> {
  const db = await initReaderDB();
  const pages = await getPagesByNotebook(notebookId);
  const results: (Interaction & { pageOrder: number })[] = [];

  for (const page of pages) {
    const interactions = await db.getAllFromIndex('interactions', 'by-page', page.id);
    for (const inter of interactions) {
      results.push({ ...inter, pageOrder: page.order });
    }
  }

  return results.sort((a, b) => b.createdAt - a.createdAt); // Newest first
}
