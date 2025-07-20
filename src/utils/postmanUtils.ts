import { PostmanCollection, PostmanItem, PostmanRequest, RequestResponse } from '@/types/postman';

export function parsePostmanCollection(json: any): PostmanCollection {
  return json as PostmanCollection;
}

export function exportCollection(collection: PostmanCollection): string {
  return JSON.stringify(collection, null, 2);
}

export function createNewCollection(name: string): PostmanCollection {
  return {
    info: {
      _postman_id: generateId(),
      name,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _exporter_id: generateId()
    },
    item: []
  };
}

export function createNewRequest(name: string): PostmanItem {
  return {
    name,
    request: {
      method: 'GET',
      header: [],
      url: '',
      auth: {
        type: 'noauth'
      }
    },
    response: []
  };
}

export function createNewFolder(name: string): PostmanItem {
  return {
    name,
    item: []
  };
}

export function findItemByPath(collection: PostmanCollection, path: string[]): PostmanItem | null {
  let current: PostmanItem[] = collection.item;
  let item: PostmanItem | null = null;

  for (const segment of path) {
    item = current.find(i => i.name === segment) || null;
    if (!item) return null;
    if (item.item) {
      current = item.item;
    }
  }

  return item;
}

export async function executeRequest(request: PostmanRequest): Promise<RequestResponse> {
  const startTime = Date.now();
  
  try {
    // Prepare URL
    const url = typeof request.url === 'string' ? request.url : request.url?.raw || '';
    
    // Prepare headers
    const headers: Record<string, string> = {};
    request.header?.forEach(h => {
      if (!h.disabled && h.key && h.value) {
        headers[h.key] = h.value;
      }
    });

    // Add auth headers
    if (request.auth?.type === 'bearer' && request.auth.bearer) {
      const token = request.auth.bearer.find(item => item.key === 'token')?.value;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Prepare body
    let body: string | undefined;
    if (request.body?.mode === 'raw' && request.body.raw) {
      body = request.body.raw;
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    // Make request
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: body && request.method !== 'GET' ? body : undefined,
    });

    const responseTime = Date.now() - startTime;
    const data = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = data;
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: parsedData,
      responseTime,
      size: new Blob([data]).size
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 0,
      statusText: 'Network Error',
      headers: {},
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      responseTime,
      size: 0
    };
  }
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

export function saveToLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
}

// File System Access API functions
export const checkFileSystemSupport = (): boolean => {
  return 'showDirectoryPicker' in window;
};

export const selectCollectionsFolder = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    if (!checkFileSystemSupport()) {
      throw new Error('File System Access API is not supported in this browser');
    }
    
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });
    
    // Save folder handle reference
    saveToLocalStorage('collections-folder-handle', dirHandle);
    return dirHandle;
  } catch (error) {
    console.error('Failed to select folder:', error);
    return null;
  }
};

export const loadCollectionsFromFolder = async (dirHandle: any): Promise<PostmanCollection[]> => {
  const collections: PostmanCollection[] = [];
  
  try {
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && name.endsWith('.collection.json')) {
        try {
          const file = await handle.getFile();
          const content = await file.text();
          const collection = parsePostmanCollection(JSON.parse(content));
          collections.push(collection);
        } catch (error) {
          console.error(`Failed to load collection ${name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load collections from folder:', error);
  }
  
  return collections;
};

export const saveCollectionToFolder = async (
  dirHandle: FileSystemDirectoryHandle,
  collection: PostmanCollection
): Promise<void> => {
  try {
    const fileName = `${collection.info.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.collection.json`;
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    
    const collectionJson = exportCollection(collection);
    await writable.write(collectionJson);
    await writable.close();
  } catch (error) {
    console.error('Failed to save collection to folder:', error);
    throw error;
  }
};

export const deleteCollectionFromFolder = async (
  dirHandle: FileSystemDirectoryHandle,
  collectionName: string
): Promise<void> => {
  try {
    const fileName = `${collectionName.replace(/[^a-zA-Z0-9-_]/g, '_')}.collection.json`;
    await dirHandle.removeEntry(fileName);
  } catch (error) {
    console.error('Failed to delete collection from folder:', error);
    throw error;
  }
};

export const importCollectionToFolder = async (
  dirHandle: FileSystemDirectoryHandle,
  file: File
): Promise<PostmanCollection> => {
  try {
    const content = await file.text();
    const collection = parsePostmanCollection(JSON.parse(content));
    
    await saveCollectionToFolder(dirHandle, collection);
    return collection;
  } catch (error) {
    console.error('Failed to import collection to folder:', error);
    throw error;
  }
};