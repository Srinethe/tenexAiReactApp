import { LogLine, RuleAnomaly } from '../types';

// Enhanced keyword lists for better detection
const PHISHING_WORDS = [
  'phish', 'malware', 'suspicious', 'attack', 'exploit', 'steal', 'fake', 
  'login', 'bank', 'paypal', 'credit', 'card', 'password', 'verify', 'secure',
  'update', 'confirm', 'account', 'suspended', 'blocked', 'verify'
];

const MALWARE_WORDS = [
  'malware', 'virus', 'trojan', 'worm', 'spyware', 'adware', 'ransomware',
  'botnet', 'backdoor', 'rootkit', 'keylogger', 'download', 'exe', 'dll',
  'suspicious', 'malicious', 'infected', 'compromised'
];

const HIGH_RISK_DOMAINS = [
  '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.club', '.online'
];

// Risk thresholds
const RISK_THRESHOLDS = {
  HIGH_RISK_SCORE: 4,
  CRITICAL_THREAT_SCORE: 5,
  HIGH_APP_RISK: 80,
  SUSPICIOUS_USER_AGENT: ['curl', 'wget', 'python', 'bot', 'crawler'],
  LARGE_REQUEST_SIZE: 50000, // bytes
  RAPID_REQUESTS: 10, // requests per 5 minutes
  FORBIDDEN_REQUESTS: 5 // 403 errors per 5 minutes
};

export function detectAnomalies(logs: LogLine[]): (RuleAnomaly | undefined)[] {
  return logs.map((log, idx, arr) => {
    const anomalies: RuleAnomaly[] = [];

    // Rule 1: High Threat Score Detection
    if (log.threatscore && parseInt(log.threatscore) >= RISK_THRESHOLDS.CRITICAL_THREAT_SCORE) {
      anomalies.push({
        anomaly: true,
        ruleReason: `Critical threat score detected: ${log.threatscore}`,
        ruleConfidenceScore: 95,
      });
    }

    // Rule 2: High App Risk Score
    if (log.app_risk_score && parseInt(log.app_risk_score) >= RISK_THRESHOLDS.HIGH_APP_RISK) {
      anomalies.push({
        anomaly: true,
        ruleReason: `High application risk score: ${log.app_risk_score}`,
        ruleConfidenceScore: 85,
      });
    }

    // Rule 3: Phishing/Malware URL Detection
    if (log.action === 'Blocked' && log.url) {
      const urlLower = log.url.toLowerCase();
      const hasPhishingWords = PHISHING_WORDS.some(word => urlLower.includes(word));
      const hasMalwareWords = MALWARE_WORDS.some(word => urlLower.includes(word));
      
      if (hasPhishingWords) {
        anomalies.push({
          anomaly: true,
          ruleReason: 'Blocked access to suspected phishing URL',
          ruleConfidenceScore: 90,
        });
      }
      
      if (hasMalwareWords) {
        anomalies.push({
          anomaly: true,
          ruleReason: 'Blocked access to suspected malware URL',
          ruleConfidenceScore: 92,
        });
      }
    }

    // Rule 4: High-Risk Domain Detection
    if (log.url && HIGH_RISK_DOMAINS.some(domain => log.url.includes(domain))) {
      anomalies.push({
        anomaly: true,
        ruleReason: 'Access to high-risk domain detected',
        ruleConfidenceScore: 75,
      });
    }

    // Rule 5: Suspicious User Agent
    if (log.user_agent && RISK_THRESHOLDS.SUSPICIOUS_USER_AGENT.some(agent => 
      log.user_agent.toLowerCase().includes(agent))) {
      anomalies.push({
        anomaly: true,
        ruleReason: 'Suspicious user agent detected',
        ruleConfidenceScore: 70,
      });
    }

    // Rule 6: Large Request Size
    if (log.throttlereqsize && parseInt(log.throttlereqsize) > RISK_THRESHOLDS.LARGE_REQUEST_SIZE) {
      anomalies.push({
        anomaly: true,
        ruleReason: 'Unusually large request size detected',
        ruleConfidenceScore: 65,
      });
    }

    // Rule 7: Rapid Request Rate (from same IP)
    if (log.srcip) {
      const windowStart = new Date(log.timestamp).getTime() - 5 * 60 * 1000;
      const recentRequests = arr.filter(l => 
        l.srcip === log.srcip &&
        new Date(l.timestamp).getTime() >= windowStart &&
        new Date(l.timestamp).getTime() <= new Date(log.timestamp).getTime()
      ).length;
      
      if (recentRequests > RISK_THRESHOLDS.RAPID_REQUESTS) {
        anomalies.push({
          anomaly: true,
          ruleReason: `High request rate from IP ${log.srcip}: ${recentRequests} requests in 5 minutes`,
          ruleConfidenceScore: 80,
        });
      }
    }

    // Rule 8: Multiple Forbidden Requests (403 errors)
    if (log.status_code === '403' && log.srcip) {
      const windowStart = new Date(log.timestamp).getTime() - 5 * 60 * 1000;
      const forbiddenCount = arr.filter(l => 
        l.srcip === log.srcip &&
        l.status_code === '403' &&
        new Date(l.timestamp).getTime() >= windowStart &&
        new Date(l.timestamp).getTime() <= new Date(log.timestamp).getTime()
      ).length;
      
      if (forbiddenCount > RISK_THRESHOLDS.FORBIDDEN_REQUESTS) {
        anomalies.push({
          anomaly: true,
          ruleReason: `Multiple forbidden requests from IP ${log.srcip}: ${forbiddenCount} 403 errors in 5 minutes`,
          ruleConfidenceScore: 85,
        });
      }
    }

    // Rule 9: Blocked Security Risk
    if (log.action === 'Blocked' && log.reason === 'Security Risk') {
      anomalies.push({
        anomaly: true,
        ruleReason: 'Security risk blocked by firewall',
        ruleConfidenceScore: 88,
      });
    }

    // Rule 10: Critical Threat Severity
    if (log.threatseverity === 'Critical') {
      anomalies.push({
        anomaly: true,
        ruleReason: 'Critical threat severity detected',
        ruleConfidenceScore: 95,
      });
    }

    // Rule 11: High Confidence Threats
    if (log.threatconfidence === 'High' && log.threatscore && parseInt(log.threatscore) > 0) {
      anomalies.push({
        anomaly: true,
        ruleReason: 'High confidence threat detected',
        ruleConfidenceScore: 90,
      });
    }

    // Rule 12: Unusual Application Categories
    const suspiciousCategories = ['Malware', 'Phishing', 'Adware', 'Unknown'];
    if (log.appclass && suspiciousCategories.includes(log.appclass)) {
      anomalies.push({
        anomaly: true,
        ruleReason: `Suspicious application category: ${log.appclass}`,
        ruleConfidenceScore: 85,
      });
    }

    // Return the highest confidence anomaly, or undefined if no anomalies
    if (anomalies.length > 0) {
      return anomalies.reduce((highest, current) => 
        current.ruleConfidenceScore > highest.ruleConfidenceScore ? current : highest
      );
    }

    return undefined;
  });
}

// Helper function to get anomaly statistics
export function getAnomalyStats(anomalies: (RuleAnomaly | undefined)[]): {
  totalAnomalies: number;
  highConfidenceAnomalies: number;
  anomalyTypes: { [key: string]: number };
  averageConfidence: number;
} {
  const validAnomalies = anomalies.filter(a => a !== undefined) as RuleAnomaly[];
  
  if (validAnomalies.length === 0) {
    return {
      totalAnomalies: 0,
      highConfidenceAnomalies: 0,
      anomalyTypes: {},
      averageConfidence: 0
    };
  }

  const anomalyTypes: { [key: string]: number } = {};
  let totalConfidence = 0;

  validAnomalies.forEach(anomaly => {
    // Extract anomaly type from reason
    const type = anomaly.ruleReason.split(':')[0];
    anomalyTypes[type] = (anomalyTypes[type] || 0) + 1;
    totalConfidence += anomaly.ruleConfidenceScore;
  });

  return {
    totalAnomalies: validAnomalies.length,
    highConfidenceAnomalies: validAnomalies.filter(a => a.ruleConfidenceScore >= 85).length,
    anomalyTypes,
    averageConfidence: Math.round(totalConfidence / validAnomalies.length)
  };
} 