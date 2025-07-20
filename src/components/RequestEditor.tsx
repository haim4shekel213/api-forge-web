import React, { useState } from 'react';
import { PostmanRequest, HttpMethod, KeyValuePair } from '@/types/postman';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { KeyValueEditor } from './KeyValueEditor';
import { Send, Play } from 'lucide-react';

interface RequestEditorProps {
  request: PostmanRequest | null;
  onRequestChange: (request: PostmanRequest) => void;
  onSendRequest: () => void;
  isLoading?: boolean;
}

const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export function RequestEditor({ request, onRequestChange, onSendRequest, isLoading }: RequestEditorProps) {
  const [activeTab, setActiveTab] = useState('headers');

  if (!request) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a request to start editing
      </div>
    );
  }

  const urlString = typeof request.url === 'string' ? request.url : request.url?.raw || '';

  const updateMethod = (method: HttpMethod) => {
    onRequestChange({ ...request, method });
  };

  const updateUrl = (url: string) => {
    onRequestChange({ ...request, url });
  };

  const updateHeaders = (pairs: KeyValuePair[]) => {
    const headers = pairs.map(pair => ({
      key: pair.key,
      value: pair.value,
      disabled: !pair.enabled,
      type: 'text'
    }));
    onRequestChange({ ...request, header: headers });
  };

  const updateBody = (body: string) => {
    onRequestChange({
      ...request,
      body: {
        mode: 'raw',
        raw: body,
        options: {
          raw: {
            language: 'json'
          }
        }
      }
    });
  };

  const updateAuth = (authType: string, config: any) => {
    onRequestChange({
      ...request,
      auth: {
        type: authType as any,
        [authType]: config
      }
    });
  };

  const headerPairs: KeyValuePair[] = request.header?.map(h => ({
    key: h.key,
    value: h.value,
    enabled: !h.disabled
  })) || [];

  return (
    <div className="flex flex-col h-full">
      {/* Request Line */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Select value={request.method} onValueChange={updateMethod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {httpMethods.map(method => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={urlString}
          onChange={(e) => updateUrl(e.target.value)}
          placeholder="Enter request URL"
          className="flex-1"
        />

        <Button 
          onClick={onSendRequest} 
          disabled={isLoading}
          className="px-6"
        >
          {isLoading ? (
            <Play className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send
        </Button>
      </div>

      {/* Request Configuration */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent">
            <TabsTrigger value="headers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Headers
            </TabsTrigger>
            <TabsTrigger value="body" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Body
            </TabsTrigger>
            <TabsTrigger value="auth" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Authorization
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="headers" className="p-4 m-0">
              <KeyValueEditor
                pairs={headerPairs}
                onChange={updateHeaders}
                placeholder={{ key: 'Header', value: 'Value' }}
              />
            </TabsContent>

            <TabsContent value="body" className="p-4 m-0">
              <div className="space-y-4">
                <div>
                  <Label>Body</Label>
                  <Textarea
                    value={request.body?.raw || ''}
                    onChange={(e) => updateBody(e.target.value)}
                    placeholder="Enter raw body content (JSON, XML, etc.)"
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="auth" className="p-4 m-0">
              <AuthEditor 
                auth={request.auth}
                onAuthChange={updateAuth}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

interface AuthEditorProps {
  auth?: any;
  onAuthChange: (authType: string, config: any) => void;
}

function AuthEditor({ auth, onAuthChange }: AuthEditorProps) {
  const [authType, setAuthType] = useState(auth?.type || 'noauth');
  const [bearerToken, setBearerToken] = useState(
    auth?.bearer?.find((item: any) => item.key === 'token')?.value || ''
  );

  const handleAuthTypeChange = (type: string) => {
    setAuthType(type);
    if (type === 'noauth') {
      onAuthChange('noauth', []);
    }
  };

  const handleBearerTokenChange = (token: string) => {
    setBearerToken(token);
    onAuthChange('bearer', [{ key: 'token', value: token, type: 'string' }]);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Type</Label>
        <Select value={authType} onValueChange={handleAuthTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="noauth">No Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="oauth2">OAuth 2.0</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {authType === 'bearer' && (
        <div>
          <Label>Token</Label>
          <Input
            value={bearerToken}
            onChange={(e) => handleBearerTokenChange(e.target.value)}
            placeholder="Enter bearer token"
            type="password"
          />
        </div>
      )}

      {authType === 'oauth2' && (
        <div className="space-y-4">
          <div>
            <Label>Grant Type</Label>
            <Select defaultValue="client_credentials">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client_credentials">Client Credentials</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Access Token URL</Label>
            <Input placeholder="https://example.com/oauth/token" />
          </div>
          <div>
            <Label>Client ID</Label>
            <Input placeholder="Your client ID" />
          </div>
          <div>
            <Label>Client Secret</Label>
            <Input type="password" placeholder="Your client secret" />
          </div>
        </div>
      )}
    </div>
  );
}