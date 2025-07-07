// Parsed log line (matches actual CSV fields)
export interface LogLine {
  timestamp: string;
  location: string;
  protocol: string;
  url: string;
  action: string;
  appname: string;
  appclass: string;
  app_risk_score: string;
  throttlereqsize: string;
  throttlerespsize: string;
  respdatasize: string;
  resphdrsize: string;
  reason: string;
  urlsupercat: string;
  urlcat: string;
  category: string;
  threatscore: string;
  threatseverity: string;
  threatconfidence: string;
  locationid: string;
  department: string;
  srcip: string;
  dstip: string;
  method: string;
  status_code: string;
  user_agent: string;
  referer: string;
  firewall_filter: string;
  firewall_name: string;
  policy_type: string;
  policy_reason: string;
  rule_label: string;
  app_rule_label: string;
  other: string;
  [key: string]: any; // Allow additional fields
}

// Rule-based anomaly
export interface RuleAnomaly {
  anomaly: true;
  ruleReason: string;
  ruleConfidenceScore: number;
}

// LLM explanation
export interface LLMExplanation {
  explanation: string;
  recommendedAction: string;
  llmConfidenceScore: number; // 0-100
}

// Combined analysis result for a log line
export interface LogAnalysisResult {
  logLine: LogLine;
  anomaly?: RuleAnomaly;
  llmExplanation?: LLMExplanation;
} 