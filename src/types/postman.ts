export interface PostmanCollection {
  info: {
    _postman_id: string;
    name: string;
    schema: string;
    _exporter_id?: string;
    description?: string;
  };
  item: PostmanItem[];
}

export interface PostmanItem {
  name: string;
  item?: PostmanItem[]; // For folders
  request?: PostmanRequest;
  response?: any[];
  protocolProfileBehavior?: any;
}

export interface PostmanRequest {
  method: HttpMethod;
  header: PostmanHeader[];
  body?: PostmanBody;
  url: PostmanUrl | string;
  auth?: PostmanAuth;
}

export interface PostmanHeader {
  key: string;
  value: string;
  type?: string;
  disabled?: boolean;
}

export interface PostmanBody {
  mode: 'raw' | 'formdata' | 'urlencoded' | 'binary' | 'graphql';
  raw?: string;
  options?: {
    raw?: {
      language: string;
    };
  };
  formdata?: Array<{
    key: string;
    value: string;
    type: string;
  }>;
}

export interface PostmanUrl {
  raw: string;
  protocol?: string;
  host?: string[];
  port?: string;
  path?: string[];
  query?: Array<{
    key: string;
    value: string;
  }>;
}

export interface PostmanAuth {
  type: 'noauth' | 'bearer' | 'oauth2' | 'basic' | 'apikey';
  bearer?: Array<{
    key: string;
    value: string;
    type: string;
  }>;
  oauth2?: Array<{
    key: string;
    value: string;
    type: string;
  }>;
  basic?: Array<{
    key: string;
    value: string;
    type: string;
  }>;
  apikey?: Array<{
    key: string;
    value: string;
    type: string;
  }>;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface RequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  size: number;
}

export interface AppState {
  collections: PostmanCollection[];
  activeCollection: string | null;
  activeRequest: string | null;
  requestHistory: RequestResponse[];
}

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}