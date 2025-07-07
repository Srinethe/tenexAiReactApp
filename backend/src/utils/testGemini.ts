import dotenv from 'dotenv';
dotenv.config();

import { geminiService } from './geminiService';
import { LogLine, RuleAnomaly } from '../types';

async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini API Integration...');
  console.log('API Key configured:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');
  
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...');
    const isConnected = await geminiService.testConnection();
    console.log('✅ Connection test:', isConnected ? 'SUCCESS' : 'FAILED');
    
    if (!isConnected) {
      console.log('❌ Gemini API connection failed. Check your API key and network connection.');
      return;
    }
    
    // Test 2: Sample log analysis
    console.log('\n2. Testing log analysis...');
    const sampleLog: LogLine = {
      timestamp: 'Mon Jun 24 10:15:21 2024',
      location: 'new-gre',
      protocol: 'HTTP',
      url: 'phishing-portal.com/login',
      action: 'Blocked',
      appname: 'PhishingSite',
      appclass: 'Phishing',
      app_risk_score: '90',
      throttlereqsize: '15000',
      throttlerespsize: '0',
      respdatasize: '0',
      resphdrsize: '0',
      reason: 'Security Risk',
      urlsupercat: 'Phishing',
      urlcat: 'Fraud',
      category: 'None',
      threatscore: '5',
      threatseverity: 'Critical',
      threatconfidence: 'High',
      locationid: 'new-gre',
      department: 'IT',
      srcip: '10.0.0.23',
      dstip: '198.51.100.23',
      method: 'GET',
      status_code: '403',
      user_agent: 'curl/7.68.0',
      referer: 'None',
      firewall_filter: 'FwFilter',
      firewall_name: 'Firewall_1',
      policy_type: 'Other',
      policy_reason: 'None',
      rule_label: 'NA',
      app_rule_label: 'NA',
      other: 'N/A'
    };
    
    const sampleAnomaly: RuleAnomaly = {
      anomaly: true,
      ruleReason: 'Critical threat score detected: 5',
      ruleConfidenceScore: 95
    };
    
    const analysis = await geminiService.analyzeLog(sampleLog, sampleAnomaly);
    console.log('✅ Log analysis test: SUCCESS');
    console.log('📝 Analysis result:');
    console.log('   Full response:', JSON.stringify(analysis, null, 2));
    console.log('   Explanation type:', typeof analysis.explanation);
    console.log('   Recommended Action type:', typeof analysis.recommendedAction);
    console.log('   Explanation:', analysis.explanation ? analysis.explanation.substring(0, 100) + '...' : 'No explanation');
    console.log('   Recommended Action:', analysis.recommendedAction ? analysis.recommendedAction.substring(0, 100) + '...' : 'No recommendation');
    console.log('   Confidence Score:', analysis.llmConfidenceScore);
    
    // Test 3: Normal log analysis
    console.log('\n3. Testing normal log analysis...');
    const normalLog: LogLine = {
      timestamp: 'Mon Jun 24 10:17:44 2024',
      location: 'default-loc',
      protocol: 'HTTPS',
      url: 'office.com/',
      action: 'Allowed',
      appname: 'Microsoft Office',
      appclass: 'Office Apps',
      app_risk_score: '20',
      throttlereqsize: '22000',
      throttlerespsize: '1500',
      respdatasize: '0',
      resphdrsize: '0',
      reason: 'None',
      urlsupercat: 'Productivity',
      urlcat: 'Office',
      category: 'None',
      threatscore: '0',
      threatseverity: 'None',
      threatconfidence: 'None',
      locationid: 'default-loc',
      department: 'Default Department',
      srcip: '10.0.0.24',
      dstip: '40.112.72.205',
      method: 'GET',
      status_code: '200',
      user_agent: 'Mozilla/5.0',
      referer: 'None',
      firewall_filter: 'FwFilter',
      firewall_name: 'Firewall_1',
      policy_type: 'Other',
      policy_reason: 'None',
      rule_label: 'NA',
      app_rule_label: 'NA',
      other: 'N/A'
    };
    
    const normalAnalysis = await geminiService.analyzeLog(normalLog);
    console.log('✅ Normal log analysis test: SUCCESS');
    console.log('📝 Normal analysis result:');
    console.log('   Full response:', JSON.stringify(normalAnalysis, null, 2));
    console.log('   Explanation type:', typeof normalAnalysis.explanation);
    console.log('   Recommended Action type:', typeof normalAnalysis.recommendedAction);
    console.log('   Explanation:', normalAnalysis.explanation ? normalAnalysis.explanation.substring(0, 100) + '...' : 'No explanation');
    console.log('   Confidence Score:', normalAnalysis.llmConfidenceScore);
    
    console.log('\n🎉 All Gemini API tests passed! The integration is working correctly.');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

testGeminiIntegration(); 