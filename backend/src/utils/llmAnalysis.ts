import { LogLine, LLMExplanation, RuleAnomaly } from '../types';
import { geminiService } from './geminiService';

export async function getLLMExplanation(log: LogLine, anomaly?: RuleAnomaly): Promise<LLMExplanation> {
  try {
    // Use real Gemini API for intelligent analysis
    const analysis = await geminiService.analyzeLog(log, anomaly);
    return analysis;
  } catch (error: any) {
    console.error('LLM analysis failed:', error.message);
    
    // Fallback to basic analysis if API fails
    let explanation = `This log entry shows ${log.action} access to ${log.url} from IP ${log.srcip}.`;
    let recommendedAction = 'Investigate the source IP and destination URL for potential security issues.';
    let confidenceScore = 60;

    if (anomaly) {
      explanation += ` Security anomaly detected: ${anomaly.ruleReason}.`;
      recommendedAction = 'Immediately investigate this anomaly and take appropriate security measures.';
      confidenceScore = anomaly.ruleConfidenceScore;
    }

    // Add contextual information
    if (log.department) {
      explanation += ` The request originated from the ${log.department} department.`;
    }

    if (log.location) {
      explanation += ` Location: ${log.location}.`;
    }

    return {
      explanation,
      recommendedAction,
      llmConfidenceScore: confidenceScore,
    };
  }
}

// Export the Gemini service for testing
export { geminiService }; 