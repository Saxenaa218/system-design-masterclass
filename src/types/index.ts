export type CategoryType = 
  | 'Foundations'
  | 'Core Distributed Systems'
  | 'Storage & Data'
  | 'Real-World Scale Systems'
  | 'Advanced Infrastructure';

export interface ArchitectureNode {
  id: string;
  label: string;
  type: 'client' | 'gateway' | 'service' | 'cache' | 'database' | 'queue' | 'worker' | 'storage' | 'cdn';
  description: string;
  status?: 'active' | 'idle' | 'processing' | 'bottleneck' | 'recovering';
  x: number;
  y: number;
  details?: {
    tech?: string[];
    metrics?: { [key: string]: string | number };
    failureMode?: string;
  };
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
  protocol?: 'HTTP/2' | 'gRPC' | 'WebSocket' | 'Kafka' | 'TCP' | 'SQL' | 'Redis Protocol';
  animated?: boolean;
}

export interface FlowStep {
  stepNumber: number;
  title: string;
  description: string;
  activeNodeIds: string[];
  activeEdgeIds?: { from: string; to: string }[];
  highlightTip?: string;
}

export interface TradeoffItem {
  approachA: string;
  approachB: string;
  verdict: string;
  prosA: string[];
  prosB: string[];
  whenToUse: string;
}

export interface KeyTakeaway {
  title: string;
  description: string;
  icon?: string;
}

export interface Chapter {
  id: number;
  slug: string;
  number: string;
  title: string;
  category: CategoryType;
  summary: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readTimeMin: number;
  problemStatement: string;
  keyRequirements: {
    functional: string[];
    nonFunctional: string[];
  };
  intuition: {
    analogy: string;
    whyNaiveFails: string;
    coreInsight: string;
  };
  architectureNodes: ArchitectureNode[];
  architectureEdges: ArchitectureEdge[];
  flowSteps: FlowStep[];
  deepDiveTopics: {
    title: string;
    content: string;
    codeSnippet?: {
      language: string;
      code: string;
      caption?: string;
    };
    callout?: {
      type: 'tip' | 'warning' | 'important';
      text: string;
    };
  }[];
  tradeoffs: TradeoffItem[];
  keyTakeaways: KeyTakeaway[];
  hasInteractiveLab?: boolean;
  labType?: 
    | 'scaling'
    | 'estimator'
    | 'framework'
    | 'rate-limiter'
    | 'consistent-hashing'
    | 'key-value-store'
    | 'unique-id'
    | 'url-shortener'
    | 'trie-autocomplete'
    | 'newsfeed'
    | 'orderbook'
    | 'generic';
}

export interface QuizQuestion {
  id: string;
  chapterId: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface EstimationPreset {
  name: string;
  dau: number; // in millions
  readWriteRatio: number; // e.g. 10 (10:1 reads to writes)
  avgWritePayloadKB: number;
  avgReadPayloadKB: number;
  hasMedia: boolean;
  avgMediaMB?: number;
  mediaPercentage?: number; // e.g. 20%
}
