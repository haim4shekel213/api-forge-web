import React, { useState } from 'react';
import { RequestResponse } from '@/types/postman';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponseViewerProps {
  response: RequestResponse | null;
  isLoading?: boolean;
}

export function ResponseViewer({ response, isLoading }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('pretty');

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadgeVariant = (status: number) => {
    if (status >= 200 && status < 300) return 'default';
    if (status >= 300 && status < 400) return 'secondary';
    if (status >= 400 && status < 500) return 'destructive';
    if (status >= 500) return 'destructive';
    return 'outline';
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-status-success';
    if (status >= 300 && status < 400) return 'text-status-redirect';
    if (status >= 400 && status < 500) return 'text-status-client-error';
    if (status >= 500) return 'text-status-server-error';
    return 'text-muted-foreground';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Sending request...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Send a request to see the response
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Response Status */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge 
              variant={getStatusBadgeVariant(response.status)}
              className={getStatusColor(response.status)}
            >
              {response.status} {response.statusText}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Time:</span>
            <span className="text-sm font-mono">{response.responseTime}ms</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Size:</span>
            <span className="text-sm font-mono">{formatBytes(response.size)}</span>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => copyToClipboard(formatJson(response.data))}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Response Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent">
            <TabsTrigger value="pretty" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Pretty
            </TabsTrigger>
            <TabsTrigger value="raw" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Raw
            </TabsTrigger>
            <TabsTrigger value="headers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Headers
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="pretty" className="p-4 m-0 h-full">
              <ScrollArea className="h-full">
                <pre className="text-sm bg-muted/50 p-4 rounded-lg overflow-auto">
                  <code>{formatJson(response.data)}</code>
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw" className="p-4 m-0 h-full">
              <ScrollArea className="h-full">
                <pre className="text-sm bg-muted/50 p-4 rounded-lg overflow-auto font-mono">
                  <code>{JSON.stringify(response.data)}</code>
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="headers" className="p-4 m-0 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-4 p-2 rounded border">
                      <div className="font-medium text-sm">{key}</div>
                      <div className="text-sm text-muted-foreground font-mono break-all">{value}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}