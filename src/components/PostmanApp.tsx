import React, { useState, useEffect } from 'react';
import { PostmanCollection, PostmanItem, PostmanRequest, RequestResponse } from '@/types/postman';
import { CollectionTree } from './CollectionTree';
import { RequestEditor } from './RequestEditor';
import { ResponseViewer } from './ResponseViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { 
  parsePostmanCollection, 
  exportCollection, 
  createNewCollection, 
  createNewRequest, 
  createNewFolder,
  findItemByPath,
  executeRequest,
  saveToLocalStorage,
  loadFromLocalStorage
} from '@/utils/postmanUtils';
import { Upload, Download, Plus, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function PostmanApp() {
  const [collections, setCollections] = useState<PostmanCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<PostmanCollection | null>(null);
  const [activeRequest, setActiveRequest] = useState<PostmanRequest | null>(null);
  const [activeRequestPath, setActiveRequestPath] = useState<string[]>([]);
  const [response, setResponse] = useState<RequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCollections = loadFromLocalStorage<PostmanCollection[]>('postman-collections', []);
    if (savedCollections.length > 0) {
      setCollections(savedCollections);
    } else {
      // Load sample collection
      const sampleCollection = createSampleCollection();
      setCollections([sampleCollection]);
    }
  }, []);

  // Save to localStorage whenever collections change
  useEffect(() => {
    saveToLocalStorage('postman-collections', collections);
  }, [collections]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const collection = parsePostmanCollection(json);
        setCollections(prev => [...prev, collection]);
        toast({
          title: "Collection imported",
          description: `Successfully imported "${collection.info.name}"`,
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid Postman collection file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExport = (collection: PostmanCollection) => {
    const json = exportCollection(collection);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.info.name}.postman_collection.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateCollection = () => {
    const name = prompt('Enter collection name:');
    if (!name) return;

    const newCollection = createNewCollection(name);
    setCollections(prev => [...prev, newCollection]);
  };

  const handleRequestSelect = (collection: PostmanCollection, item: PostmanItem, path: string[]) => {
    if (item.request) {
      setActiveCollection(collection);
      setActiveRequest(item.request);
      setActiveRequestPath(path);
      setResponse(null);
    }
  };

  const handleRequestChange = (newRequest: PostmanRequest) => {
    if (!activeCollection || !activeRequestPath.length) return;

    const updatedCollections = collections.map(collection => {
      if (collection.info._postman_id === activeCollection.info._postman_id) {
        const updatedCollection = { ...collection };
        const item = findItemByPath(updatedCollection, activeRequestPath);
        if (item && item.request) {
          item.request = newRequest;
        }
        return updatedCollection;
      }
      return collection;
    });

    setCollections(updatedCollections);
    setActiveRequest(newRequest);
    setActiveCollection(updatedCollections.find(c => c.info._postman_id === activeCollection.info._postman_id) || null);
  };

  const handleSendRequest = async () => {
    if (!activeRequest) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const result = await executeRequest(activeRequest);
      setResponse(result);
      
      if (result.status >= 200 && result.status < 300) {
        toast({
          title: "Request successful",
          description: `${result.status} ${result.statusText} (${result.responseTime}ms)`,
        });
      }
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRequest = (collection: PostmanCollection, folderPath?: string[]) => {
    const name = prompt('Enter request name:');
    if (!name) return;

    const newRequest = createNewRequest(name);
    
    const updatedCollections = collections.map(col => {
      if (col.info._postman_id === collection.info._postman_id) {
        const updatedCollection = { ...col };
        
        if (!folderPath || folderPath.length === 0) {
          updatedCollection.item.push(newRequest);
        } else {
          const folder = findItemByPath(updatedCollection, folderPath);
          if (folder && folder.item) {
            folder.item.push(newRequest);
          }
        }
        
        return updatedCollection;
      }
      return col;
    });

    setCollections(updatedCollections);
  };

  const handleAddFolder = (collection: PostmanCollection, folderPath?: string[]) => {
    const name = prompt('Enter folder name:');
    if (!name) return;

    const newFolder = createNewFolder(name);
    
    const updatedCollections = collections.map(col => {
      if (col.info._postman_id === collection.info._postman_id) {
        const updatedCollection = { ...col };
        
        if (!folderPath || folderPath.length === 0) {
          updatedCollection.item.push(newFolder);
        } else {
          const folder = findItemByPath(updatedCollection, folderPath);
          if (folder && folder.item) {
            folder.item.push(newFolder);
          }
        }
        
        return updatedCollection;
      }
      return col;
    });

    setCollections(updatedCollections);
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Postman Clone
          </h1>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCreateCollection}>
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
            
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            {activeCollection && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport(activeCollection)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full border-r border-border bg-sidebar">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-sidebar-foreground">Collections</h2>
              </div>
              <div className="overflow-auto">
                <CollectionTree
                  collections={collections}
                  activeRequest={activeRequestPath.join('/')}
                  onRequestSelect={handleRequestSelect}
                  onAddRequest={handleAddRequest}
                  onAddFolder={handleAddFolder}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Panel */}
          <ResizablePanel defaultSize={75}>
            <ResizablePanelGroup direction="vertical">
              {/* Request Editor */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <RequestEditor
                  request={activeRequest}
                  onRequestChange={handleRequestChange}
                  onSendRequest={handleSendRequest}
                  isLoading={isLoading}
                />
              </ResizablePanel>

              <ResizableHandle />

              {/* Response Viewer */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="border-t border-border h-full">
                  <ResponseViewer response={response} isLoading={isLoading} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

function createSampleCollection(): PostmanCollection {
  return {
    info: {
      _postman_id: 'sample-collection-id',
      name: 'Sample API Collection',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _exporter_id: 'sample-exporter-id'
    },
    item: [
      {
        name: 'GET Example',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
              type: 'text'
            }
          ],
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          auth: {
            type: 'noauth'
          }
        },
        response: []
      },
      {
        name: 'POST Example',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
              type: 'text'
            }
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              title: 'foo',
              body: 'bar',
              userId: 1
            }, null, 2),
            options: {
              raw: {
                language: 'json'
              }
            }
          },
          url: 'https://jsonplaceholder.typicode.com/posts',
          auth: {
            type: 'noauth'
          }
        },
        response: []
      }
    ]
  };
}