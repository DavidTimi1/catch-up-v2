import { useState, useEffect, useCallback } from "react";
import { 
  getNotebooks, 
  getNotebook, 
  getPagesByNotebook, 
  getInteractionsByNotebook,
  Notebook,
  ReaderPage,
  Interaction
} from "@/lib/db/localReaderDb";

export function useNotebooks() {
  const [data, setData] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getNotebooks();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch notebooks"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, setData };
}

export function useNotebook(id: string) {
  const [data, setData] = useState<Notebook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getNotebook(id);
      setData(result || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch notebook"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, setData };
}

export function usePages(notebookId: string) {
  const [data, setData] = useState<ReaderPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPagesByNotebook(notebookId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch pages"));
    } finally {
      setIsLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, setData };
}

export function useHistory(notebookId: string) {
  const [data, setData] = useState<(Interaction & { pageOrder: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getInteractionsByNotebook(notebookId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch history"));
    } finally {
      setIsLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, setData };
}
