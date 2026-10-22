export interface MaintenanceRecord {
  id: number;
  ident: string;
  problem: string;
  action: string;
  problem_clean?: string;
  action_clean?: string;
  combined_clean?: string;
  component_tag?: string;
  action_type?: string;
  performed_edit?: string;
  source_filename: string;
  created_at?: string;
}

export interface RecordListResponse {
  items: MaintenanceRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SearchResultItem {
  ident: string;
  problem: string;
  action: string;
  combined_clean?: string;
  component_tag?: string;
  action_type?: string;
  score: number;
  dense_score?: number;
  lexical_score?: number;
  match_reasons: string[];
}

export interface SearchResponse {
  query: string;
  mode: string;
  total_hits: number;
  results: SearchResultItem[];
}

export interface CitationItem {
  ident: string;
  problem: string;
  action: string;
  excerpt: string;
  verified: boolean;
}

export interface AgentStepItem {
  step: number;
  tool: string;
  input_args: Record<string, any>;
  output_summary: string;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  intent: string;
  step_count: number;
  agent_steps: AgentStepItem[];
  citations: CitationItem[];
  disclaimer: string;
  latency_ms: number;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  step_count?: number;
  citations?: CitationItem[];
  agent_steps?: AgentStepItem[];
  created_at?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  message_count: number;
}

export interface ComponentMetric {
  component: string;
  count: number;
  percentage: number;
}

export interface ActionTypeMetric {
  action_type: string;
  count: number;
  percentage: number;
}

export interface IngestionStatus {
  is_ingested: boolean;
  total_records: number;
  source_files: string[];
  last_ingested_at?: string;
  vector_indexed: boolean;
  vector_count: number;
}

export interface AnalyticsOverview {
  total_records: number;
  unique_components: number;
  unique_actions: number;
  top_components: ComponentMetric[];
  top_action_types: ActionTypeMetric[];
  recent_records: any[];
  ingestion_summary: IngestionStatus;
  disclaimer: string;
}

export interface TestCaseResult {
  id: string;
  query: string;
  query_type: string;
  expected_idents: string[];
  retrieved_idents: string[];
  recall_hit: boolean;
  reciprocal_rank: number;
  generated_answer?: string;
  cited_idents: string[];
  citations_valid: boolean;
  citation_precision: number;
  latency_ms: number;
}

export interface EvaluationMetrics {
  recall_at_1: number;
  recall_at_3: number;
  recall_at_5: number;
  mean_reciprocal_rank: number;
  citation_precision: number;
  citation_validity: number;
  avg_retrieval_latency_ms: number;
  avg_total_latency_ms: number;
}

export interface EvaluationReport {
  run_id: string;
  timestamp: string;
  num_test_cases: number;
  metrics: EvaluationMetrics;
  results: TestCaseResult[];
  evaluated_model: string;
  embedding_model: string;
}

export interface ModelSettings {
  provider: 'local' | 'gemini' | 'openai' | 'ollama' | 'mock';
  model_name: string;
  has_gemini_key: boolean;
  has_openai_key: boolean;
  masked_key?: string | null;
  temperature: number;
  base_url?: string | null;
}

