import axios from 'axios';
import {
  RecordListResponse,
  MaintenanceRecord,
  SearchResponse,
  ChatResponse,
  ChatSession,
  ChatMessage,
  AnalyticsOverview,
  IngestionStatus,
  EvaluationReport
} from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Health
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Records
  getRecords: async (params: {
    page?: number;
    page_size?: number;
    query?: string;
    component?: string;
    action_type?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<RecordListResponse> => {
    const res = await apiClient.get<RecordListResponse>('/records', { params });
    return res.data;
  },

  getRecordDetail: async (ident: string): Promise<MaintenanceRecord> => {
    const res = await apiClient.get<MaintenanceRecord>(`/records/${ident}`);
    return res.data;
  },

  getComponents: async (): Promise<string[]> => {
    const res = await apiClient.get<{ components: string[] }>('/records/components/list');
    return res.data.components;
  },

  getActionTypes: async (): Promise<string[]> => {
    const res = await apiClient.get<{ action_types: string[] }>('/records/actions/list');
    return res.data.action_types;
  },

  // Search
  searchHybrid: async (query: string, component?: string, top_k: number = 5): Promise<SearchResponse> => {
    const res = await apiClient.post<SearchResponse>('/search/hybrid', {
      query,
      component: component === 'ALL' ? undefined : component,
      top_k
    });
    return res.data;
  },

  // Chat
  sendMessage: async (query: string, session_id?: string): Promise<ChatResponse> => {
    const res = await apiClient.post<ChatResponse>('/chat', {
      query,
      session_id
    });
    return res.data;
  },

  getSessions: async (): Promise<ChatSession[]> => {
    const res = await apiClient.get<ChatSession[]>('/chat/sessions');
    return res.data;
  },

  getSessionHistory: async (session_id: string): Promise<ChatMessage[]> => {
    const res = await apiClient.get<ChatMessage[]>(`/chat/sessions/${session_id}`);
    return res.data;
  },

  deleteSession: async (session_id: string): Promise<void> => {
    await apiClient.delete(`/chat/sessions/${session_id}`);
  },

  // Analytics
  getAnalyticsOverview: async (): Promise<AnalyticsOverview> => {
    const res = await apiClient.get<AnalyticsOverview>('/analytics/overview');
    return res.data;
  },

  // Ingestion
  getIngestionStatus: async (): Promise<IngestionStatus> => {
    const res = await apiClient.get<IngestionStatus>('/ingestion/status');
    return res.data;
  },

  getDictionaries: async () => {
    const res = await apiClient.get('/ingestion/dictionaries');
    return res.data;
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/ingestion/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  reindexVectors: async () => {
    const res = await apiClient.post('/ingestion/reindex');
    return res.data;
  },

  // Evaluation
  runEvaluation: async (top_k: number = 5): Promise<EvaluationReport> => {
    const res = await apiClient.post<EvaluationReport>('/evaluation/run', {
      top_k,
      run_llm_answers: true
    });
    return res.data;
  },

  getLatestEvaluation: async (): Promise<EvaluationReport> => {
    const res = await apiClient.get<EvaluationReport>('/evaluation/latest');
    return res.data;
  }
};
