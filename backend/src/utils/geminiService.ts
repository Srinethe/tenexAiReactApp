import axios from 'axios';
import { LogLine, RuleAnomaly, LLMExplanation } from '../types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

class GeminiService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-2.0-flash';
    
    if (!this.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables. LLM analysis will be disabled.');
    }
  }

  private async makeRequest(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    try {
      const response = await axios.post<GeminiResponse>(
        `${this.baseUrl}/models/${this.model}:generateContent`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.apiKey
          },
          timeout: 30000 // 30 second timeout
        }
      );

      if (response.data.candidates && response.data.candidates.length > 0) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('No response content from Gemini API');
      }
    } catch (error: any) {
      if (error.response) {
        console.error('Gemini API Error:', error.response.data);
        throw new Error(`Gemini API Error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('Gemini API Network Error:', error.message);
        throw new Error('Network error connecting to Gemini API');
      } else {
        console.error('Gemini API Error:', error.message);
        throw new Error(`Gemini API Error: ${error.message}`);
      }
    }
  }

  private createAnalysisPrompt(log: LogLine, anomaly?: RuleAnomaly): string {
    const logContext = `
Log Entry Details:
- Timestamp: ${log.timestamp}
- Source IP: ${log.srcip}
- Destination URL: ${log.url}
- Action: ${log.action}
- Status Code: ${log.status_code}
- User Agent: ${log.user_agent}
- Application: ${log.appname} (${log.appclass})
- App Risk Score: ${log.app_risk_score}
- Threat Score: ${log.threatscore}
- Threat Severity: ${log.threatseverity}
- Threat Confidence: ${log.threatconfidence}
- Department: ${log.department}
- Location: ${log.location}
- Request Size: ${log.throttlereqsize} bytes
- Response Size: ${log.throttlerespsize} bytes
- Reason: ${log.reason}
- Category: ${log.category}
- URL Category: ${log.urlcat}
- URL Super Category: ${log.urlsupercat}
`;

    const anomalyContext = anomaly ? `
Security Anomaly Detected:
- Anomaly Type: ${anomaly.ruleReason}
- Confidence Score: ${anomaly.ruleConfidenceScore}%
` : '';

    const prompt = `You are a cybersecurity analyst specializing in log analysis and threat detection. Analyze the following network log entry and provide a detailed security assessment.

${logContext}${anomalyContext}

Please provide a comprehensive analysis in the following JSON format:
{
  "explanation": "Detailed explanation of what this log entry indicates, including security implications and context",
  "recommendedAction": "Specific, actionable recommendations for security teams",
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "confidenceScore": 85,
  "keyIndicators": ["indicator1", "indicator2"],
  "threatCategory": "PHISHING|MALWARE|DDoS|UNAUTHORIZED_ACCESS|DATA_EXFILTRATION|OTHER"
}

Focus on:
1. Security implications of the activity
2. Potential threats or attacks
3. Context from the organization (department, location)
4. Specific, actionable recommendations
5. Risk assessment based on the data

Respond only with valid JSON.`;

    return prompt;
  }

  private parseGeminiResponse(response: string): LLMExplanation {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Handle recommendedAction which might be an array or string
        let recommendedAction = '';
        if (Array.isArray(parsed.recommendedAction)) {
          // If it's an array, join with newlines
          recommendedAction = parsed.recommendedAction.join('\n');
        } else if (typeof parsed.recommendedAction === 'string') {
          recommendedAction = parsed.recommendedAction;
        } else {
          recommendedAction = 'Review the log entry and investigate further';
        }
        
        return {
          explanation: parsed.explanation || 'Analysis completed',
          recommendedAction: recommendedAction,
          llmConfidenceScore: parsed.confidenceScore || parsed.llmConfidenceScore || 85
        };
      } else {
        // Fallback: treat the entire response as explanation
        return {
          explanation: response,
          recommendedAction: 'Review the log entry and investigate further',
          llmConfidenceScore: 75
        };
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        explanation: response,
        recommendedAction: 'Review the log entry and investigate further',
        llmConfidenceScore: 70
      };
    }
  }

  async analyzeLog(log: LogLine, anomaly?: RuleAnomaly): Promise<LLMExplanation> {
    try {
      const prompt = this.createAnalysisPrompt(log, anomaly);
      const response = await this.makeRequest(prompt);
      return this.parseGeminiResponse(response);
    } catch (error: any) {
      console.error('Gemini analysis failed:', error.message);
      
      // Fallback to basic analysis if API fails
      return {
        explanation: `Analysis failed: ${error.message}. Log entry shows ${log.action} access to ${log.url} from IP ${log.srcip}.`,
        recommendedAction: 'Investigate manually and check API configuration.',
        llmConfidenceScore: 50
      };
    }
  }

  async analyzeEntireFile(analysisData: {
    logLines: LogLine[];
    anomalies: RuleAnomaly[];
    anomalyStats: any;
    fileInfo: any;
  }): Promise<{
    summary: string;
    keyFindings: string[];
    recommendedActions: string[];
    riskLevel: string;
    aiConfidenceScore: number;
  }> {
    try {
      const prompt = this.createFileAnalysisPrompt(analysisData);
      const response = await this.makeRequest(prompt);
      return this.parseFileAnalysisResponse(response);
    } catch (error: any) {
      console.error('Gemini file analysis failed:', error.message);
      
      // Fallback response
      return {
        summary: `Analysis failed: ${error.message}. Please review the ${analysisData.anomalies.length} anomalies manually.`,
        keyFindings: ['Analysis unavailable - check system configuration'],
        recommendedActions: ['Review anomalies manually', 'Check API configuration'],
        riskLevel: 'Unknown',
        aiConfidenceScore: 0
      };
    }
  }

  private createFileAnalysisPrompt(analysisData: {
    logLines: LogLine[];
    anomalies: RuleAnomaly[];
    anomalyStats: any;
    fileInfo: any;
  }): string {
    const { logLines, anomalies, anomalyStats, fileInfo } = analysisData;
    
    return `You are a cybersecurity expert analyzing a log file. Please provide a comprehensive analysis of the entire file.

FILE INFORMATION:
- Filename: ${fileInfo.filename}
- Total log entries: ${fileInfo.totalLines}
- Anomalies detected: ${fileInfo.anomalyCount} (${fileInfo.anomalyPercentage}%)
- Average confidence: ${anomalyStats.averageConfidence}%

ANOMALY STATISTICS:
- High confidence anomalies: ${anomalyStats.highConfidenceAnomalies}
- Anomaly types: ${Object.entries(anomalyStats.anomalyTypes).map(([type, count]) => `${type}: ${count}`).join(', ')}

SAMPLE ANOMALIES (first 5):
${anomalies.slice(0, 5).map((anomaly, index) => 
  `${index + 1}. ${anomaly.ruleReason} (Confidence: ${anomaly.ruleConfidenceScore}%)`
).join('\n')}

LOG FILE OVERVIEW:
- Total entries analyzed: ${logLines.length}
- Blocked requests: ${logLines.filter(log => log.action === 'Blocked').length}
- Allowed requests: ${logLines.filter(log => log.action === 'Allowed').length}
- Critical threats: ${logLines.filter(log => log.threatseverity === 'Critical').length}
- Unique source IPs: ${new Set(logLines.map(log => log.srcip)).size}

Please provide a comprehensive analysis in the following JSON format:
{
  "summary": "A 2-3 sentence overview of the security posture and main concerns",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "recommendedActions": ["Action 1", "Action 2", "Action 3"],
  "riskLevel": "Low/Medium/High/Critical",
  "aiConfidenceScore": 85
}

Focus on:
1. Overall security posture assessment
2. Most critical threats identified
3. Patterns or trends in the anomalies
4. Immediate actions needed
5. Long-term security recommendations`;
  }

  private parseFileAnalysisResponse(response: string): {
    summary: string;
    keyFindings: string[];
    recommendedActions: string[];
    riskLevel: string;
    aiConfidenceScore: number;
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Analysis completed',
          keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : ['Analysis completed'],
          recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : ['Review results'],
          riskLevel: parsed.riskLevel || 'Medium',
          aiConfidenceScore: parsed.aiConfidenceScore || 75
        };
      }
      
      // Fallback parsing if JSON extraction fails
      return {
        summary: response.slice(0, 200) + '...',
        keyFindings: ['Analysis completed - review full response'],
        recommendedActions: ['Review the analysis results'],
        riskLevel: 'Medium',
        aiConfidenceScore: 70
      };
    } catch (error) {
      console.error('Failed to parse file analysis response:', error);
      return {
        summary: 'Analysis completed but response parsing failed',
        keyFindings: ['Review anomalies manually'],
        recommendedActions: ['Check system configuration'],
        riskLevel: 'Unknown',
        aiConfidenceScore: 50
      };
    }
  }

  // Test the API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('Say "Hello" in one word.');
      return response.toLowerCase().includes('hello');
    } catch (error) {
      console.error('Gemini API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService(); 