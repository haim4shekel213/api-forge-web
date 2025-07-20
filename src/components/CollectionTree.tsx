import React, { useState } from 'react';
import { PostmanCollection, PostmanItem } from '@/types/postman';
import { ChevronDown, ChevronRight, Folder, FileText, Plus, MoreHorizontal } from 'lucide-react';
import { HttpMethodBadge } from './HttpMethodBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollectionTreeProps {
  collections: PostmanCollection[];
  activeRequest: string | null;
  onRequestSelect: (collection: PostmanCollection, item: PostmanItem, path: string[]) => void;
  onAddRequest: (collection: PostmanCollection, folderPath?: string[]) => void;
  onAddFolder: (collection: PostmanCollection, folderPath?: string[]) => void;
}

interface TreeItemProps {
  collection: PostmanCollection;
  item: PostmanItem;
  level: number;
  path: string[];
  activeRequest: string | null;
  onRequestSelect: (collection: PostmanCollection, item: PostmanItem, path: string[]) => void;
  onAddRequest: (collection: PostmanCollection, folderPath?: string[]) => void;
  onAddFolder: (collection: PostmanCollection, folderPath?: string[]) => void;
}

function TreeItem({
  collection,
  item,
  level,
  path,
  activeRequest,
  onRequestSelect,
  onAddRequest,
  onAddFolder,
}: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const isFolder = !!item.item;
  const isActive = activeRequest === item.name;
  const currentPath = [...path, item.name];

  const handleToggle = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else if (item.request) {
      onRequestSelect(collection, item, currentPath);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-md hover:bg-accent transition-colors',
          isActive && 'bg-primary/20 text-primary-foreground',
          `ml-${level * 4}`
        )}
        onClick={handleToggle}
      >
        {isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Folder className="h-4 w-4 text-primary" />
            <span className="flex-1 truncate">{item.name}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddRequest(collection, currentPath);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFolder(collection, currentPath);
                }}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-4" />
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.request && (
                <HttpMethodBadge method={item.request.method} className="flex-shrink-0" />
              )}
              <span className="truncate">{item.name}</span>
            </div>
          </>
        )}
      </div>

      {isFolder && isExpanded && item.item && (
        <div className="ml-4">
          {item.item.map((subItem, index) => (
            <TreeItem
              key={`${subItem.name}-${index}`}
              collection={collection}
              item={subItem}
              level={level + 1}
              path={currentPath}
              activeRequest={activeRequest}
              onRequestSelect={onRequestSelect}
              onAddRequest={onAddRequest}
              onAddFolder={onAddFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CollectionTree({
  collections,
  activeRequest,
  onRequestSelect,
  onAddRequest,
  onAddFolder,
}: CollectionTreeProps) {
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(collections.map(c => c.info.name))
  );

  const toggleCollection = (collectionName: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionName)) {
      newExpanded.delete(collectionName);
    } else {
      newExpanded.add(collectionName);
    }
    setExpandedCollections(newExpanded);
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      {collections.map((collection) => (
        <div key={collection.info._postman_id} className="group">
          <div
            className="flex items-center gap-2 px-2 py-2 text-sm font-medium cursor-pointer rounded-md hover:bg-accent transition-colors"
            onClick={() => toggleCollection(collection.info.name)}
          >
            {expandedCollections.has(collection.info.name) ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Folder className="h-4 w-4 text-primary" />
            <span className="flex-1 truncate">{collection.info.name}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddRequest(collection);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFolder(collection);
                }}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {expandedCollections.has(collection.info.name) && (
            <div className="ml-4 mt-1">
              {collection.item.map((item, index) => (
                <TreeItem
                  key={`${item.name}-${index}`}
                  collection={collection}
                  item={item}
                  level={0}
                  path={[]}
                  activeRequest={activeRequest}
                  onRequestSelect={onRequestSelect}
                  onAddRequest={onAddRequest}
                  onAddFolder={onAddFolder}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}