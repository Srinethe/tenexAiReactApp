import React, { useContext, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import LogUpload from './components/LogUpload';
import authService from './services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE_URL_WITH_API = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

const AppContent: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisDetails, setAnalysisDetails] = useState<any>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [anomaliesModalOpen, setAnomaliesModalOpen] = useState(false);
  const [anomaliesData, setAnomaliesData] = useState<any>(null);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    setError(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL_WITH_API}/logs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleAnalyze = async (logId: number) => {
    setAnalyzingId(logId);
    setError(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL_WITH_API}/logs/${logId}/analyze`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: Failed to analyze log`);
      }
      
      const data = await res.json();
      console.log('Analysis response:', data);
      
      // Show success message
      if (data.status === 'success') {
        // You could add a toast notification here
        console.log(`Analysis completed: ${data.message}`);
      }
      
      // Refresh the logs list to show updated status
      await fetchLogs();
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze log');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleViewAnalysis = async (logId: number) => {
    setError(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL_WITH_API}/logs/${logId}/analysis`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch analysis');
      const data = await res.json();
      setAnalysisDetails(data.analysis);
      setAnalysisModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analysis');
    }
  };

  const handleViewAnomalies = async (logId: number) => {
    setError(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL_WITH_API}/logs/${logId}/anomalies`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch anomalies');
      const data = await res.json();
      setAnomaliesData(data);
      setAnomaliesModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch anomalies');
    }
  };

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <div className="text-xl text-black">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-black">Cybersecurity Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-black">Welcome, {user.email}</span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-200"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Upload Section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-black mb-4">Upload Log File</h2>
          <LogUpload onUploadSuccess={fetchLogs} />
        </section>

        {/* Upload History Section */}
        <section>
          <h2 className="text-xl font-semibold text-black mb-4">Upload History</h2>
          {loadingLogs ? (
            <div className="text-gray-600">Loading logs...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : logs.length === 0 ? (
            <div className="text-gray-500">No logs uploaded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Analysis</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="px-4 py-2 text-black">{log.original_filename}</td>
                      <td className="px-4 py-2 text-gray-700">{new Date(log.upload_date).toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {log.analysis_status === 'completed' ? (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Analyzed
                            </span>
                            <span className="text-xs text-gray-500">
                              {log.total_anomalies || 0} anomalies found
                            </span>
                            {log.analysis_summary?.anomaly_statistics?.average_confidence && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                log.analysis_summary.anomaly_statistics.average_confidence >= 85 
                                  ? 'bg-green-100 text-green-800' 
                                  : log.analysis_summary.anomaly_statistics.average_confidence >= 70 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {log.analysis_summary.anomaly_statistics.average_confidence}% confidence
                              </span>
                            )}
                          </div>
                        ) : log.analysis_status === 'pending' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Analyzed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {log.analysis_status === 'completed' ? (
                          <div className="flex space-x-2">
                            <button
                              className="text-cyan-600 hover:underline"
                              onClick={() => handleViewAnalysis(log.id)}
                            >
                              View Analysis
                            </button>
                            <button
                              className="text-red-600 hover:underline"
                              onClick={() => handleViewAnomalies(log.id)}
                            >
                              View Anomalies
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-blue-600 hover:underline mr-4 disabled:opacity-50"
                            onClick={() => handleAnalyze(log.id)}
                            disabled={analyzingId === log.id}
                          >
                            {analyzingId === log.id ? 'Analyzing...' : 'Analyze'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Analysis Modal */}
      {analysisModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setAnalysisModalOpen(false)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold mb-4 text-black">Analysis Details</h3>
            
            {analysisDetails && (
              <div className="space-y-6">
                {/* Confidence Score Section - Top Priority */}
                {analysisDetails.analysis_summary?.anomaly_statistics?.average_confidence && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Analysis Confidence Score
                    </h4>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {analysisDetails.analysis_summary.anomaly_statistics.average_confidence}%
                        </div>
                        <div className="text-sm text-blue-700 font-medium">
                          Average Confidence Level
                        </div>
                        <div className="mt-2">
                          {analysisDetails.analysis_summary.anomaly_statistics.average_confidence >= 85 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              High Confidence
                            </span>
                          ) : analysisDetails.analysis_summary.anomaly_statistics.average_confidence >= 70 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Medium Confidence
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Low Confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-blue-600 text-center">
                      <p>This score represents the average confidence level of all detected anomalies in your log analysis.</p>
                    </div>
                  </div>
                )}

                {/* Confidence Score Breakdown */}
                {analysisDetails.analysis_summary?.anomaly_statistics && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-black mb-3">Confidence Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {analysisDetails.analysis_summary.anomaly_statistics.high_confidence_anomalies || 0}
                        </div>
                        <div className="text-sm text-gray-600">High Confidence Anomalies</div>
                        <div className="text-xs text-green-600">(≥85% confidence)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {analysisDetails.total_anomalies - (analysisDetails.analysis_summary.anomaly_statistics.high_confidence_anomalies || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Other Anomalies</div>
                        <div className="text-xs text-blue-600">(&lt;85% confidence)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {analysisDetails.analysis_summary.anomaly_statistics.average_confidence || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Average Confidence</div>
                        <div className="text-xs text-purple-600">Overall Score</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Analysis Section */}
                {analysisDetails.analysis_summary?.ai_analysis && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <svg className="h-6 w-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <h4 className="text-lg font-bold text-blue-900">AI-Powered Security Analysis</h4>
                      <div className="ml-auto flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          analysisDetails.analysis_summary.ai_analysis.riskLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                          analysisDetails.analysis_summary.ai_analysis.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                          analysisDetails.analysis_summary.ai_analysis.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {analysisDetails.analysis_summary.ai_analysis.riskLevel} Risk
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {analysisDetails.analysis_summary.ai_analysis.aiConfidenceScore}% AI Confidence
                        </span>
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="mb-6">
                      <h5 className="text-md font-semibold text-blue-800 mb-2">Analysis Summary</h5>
                      <p className="text-blue-900 bg-white rounded-lg p-4 border border-blue-200">
                        {analysisDetails.analysis_summary.ai_analysis.summary}
                      </p>
                    </div>

                    {/* Key Findings */}
                    <div className="mb-6">
                      <h5 className="text-md font-semibold text-blue-800 mb-3">Key Findings</h5>
                      <div className="space-y-2">
                        {analysisDetails.analysis_summary.ai_analysis.keyFindings.map((finding: string, index: number) => (
                          <div key={index} className="flex items-start space-x-3 bg-white rounded-lg p-3 border border-blue-200">
                            <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-blue-900">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    <div>
                      <h5 className="text-md font-semibold text-blue-800 mb-3">Recommended Actions</h5>
                      <div className="space-y-2">
                        {analysisDetails.analysis_summary.ai_analysis.recommendedActions.map((action: string, index: number) => (
                          <div key={index} className="flex items-start space-x-3 bg-white rounded-lg p-3 border border-blue-200">
                            <svg className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-blue-900 font-medium">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-black mb-3">Analysis Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-600">{analysisDetails.total_analyzed}</div>
                      <div className="text-sm text-gray-600">Total Analyzed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{analysisDetails.total_anomalies}</div>
                      <div className="text-sm text-gray-600">Anomalies Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysisDetails.analysis_summary?.anomaly_percentage || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Anomaly Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analysisDetails.analysis_status}
                      </div>
                      <div className="text-sm text-gray-600">Status</div>
                    </div>
                  </div>
                </div>

                {/* File Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-black mb-3">File Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Filename:</span>
                      <div className="text-sm text-black">{analysisDetails.original_filename}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Upload Date:</span>
                      <div className="text-sm text-black">{new Date(analysisDetails.upload_date).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Analysis Date:</span>
                      <div className="text-sm text-black">{new Date(analysisDetails.analysis_date).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Analysis ID:</span>
                      <div className="text-sm text-black">{analysisDetails.id}</div>
                    </div>
                  </div>
                </div>

                {/* Security Insights */}
                {analysisDetails.analysis_summary?.security_insights && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-black mb-3">Security Insights</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">{analysisDetails.analysis_summary.security_insights.blocked_requests}</div>
                        <div className="text-sm text-gray-600">Blocked Requests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{analysisDetails.analysis_summary.security_insights.allowed_requests}</div>
                        <div className="text-sm text-gray-600">Allowed Requests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">{analysisDetails.analysis_summary.security_insights.critical_threats}</div>
                        <div className="text-sm text-gray-600">Critical Threats</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">{analysisDetails.analysis_summary.security_insights.high_risk_apps}</div>
                        <div className="text-sm text-gray-600">High Risk Apps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{analysisDetails.analysis_summary.security_insights.suspicious_ips}</div>
                        <div className="text-sm text-gray-600">Suspicious IPs</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Anomaly Types */}
                {analysisDetails.analysis_summary?.anomaly_statistics?.top_anomaly_types && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-black mb-3">Top Anomaly Types</h4>
                    <div className="space-y-2">
                      {analysisDetails.analysis_summary.anomaly_statistics.top_anomaly_types.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center bg-white rounded p-2">
                          <span className="text-sm text-black">{item.type}</span>
                          <span className="text-sm font-semibold text-red-600">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Analysis Summary */}
                {analysisDetails.analysis_summary && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-black mb-3">Detailed Summary</h4>
                    <pre className="bg-white rounded p-4 text-sm text-black overflow-x-auto">
                      {JSON.stringify(analysisDetails.analysis_summary, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Raw Data (for debugging) */}
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="text-md font-semibold text-black cursor-pointer">Raw Analysis Data</summary>
                  <pre className="bg-white rounded p-4 text-sm text-black overflow-x-auto mt-3">
                    {JSON.stringify(analysisDetails, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anomalies Modal */}
      {anomaliesModalOpen && anomaliesData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setAnomaliesModalOpen(false)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-lg font-semibold mb-4 text-black">Anomaly Details</h3>
            
            {/* Summary Header */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{anomaliesData.totalEntries}</div>
                  <div className="text-sm text-gray-600">Total Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{anomaliesData.anomalousEntries}</div>
                  <div className="text-sm text-gray-600">Anomalous Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{anomaliesData.averageConfidence}%</div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{anomaliesData.highConfidenceAnomalies}</div>
                  <div className="text-sm text-gray-600">High Confidence</div>
                </div>
              </div>
              
              {/* AI Analysis Summary */}
              <div className="mt-4 pt-4 border-t border-red-200">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center text-blue-600">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-sm font-semibold">AI-Powered Analysis</span>
                  </div>
                  <span className="text-sm text-gray-600">•</span>
                  <span className="text-sm text-gray-600">Each anomaly includes AI-generated explanations and recommendations</span>
                </div>
              </div>
            </div>

            {/* Anomalies List */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-black">Detected Anomalies</h4>
              
              {anomaliesData.anomalyDetails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No anomalies detected in this log file.</p>
                </div>
              ) : (
                anomaliesData.anomalyDetails.map((anomaly: any, index: number) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    {/* Anomaly Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Anomaly #{index + 1}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          anomaly.anomalyDetails.confidenceLevel === 'High' 
                            ? 'bg-green-100 text-green-800' 
                            : anomaly.anomalyDetails.confidenceLevel === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {anomaly.anomalyDetails.confidenceScore}% Confidence
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(anomaly.anomalyDetails.timestamp).toLocaleString()}
                      </div>
                    </div>

                    {/* Anomaly Reason */}
                    <div className="mb-3">
                      <h5 className="text-sm font-semibold text-red-800 mb-1">Reason:</h5>
                      <p className="text-sm text-red-700 bg-red-100 rounded p-2">
                        {anomaly.anomalyDetails.reason}
                      </p>
                    </div>

                    {/* Log Entry Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Source IP:</span>
                        <div className="text-black font-mono">{anomaly.anomalyDetails.sourceIP}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Destination:</span>
                        <div className="text-black font-mono truncate">{anomaly.anomalyDetails.destination}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Action:</span>
                        <div className={`font-semibold ${
                          anomaly.anomalyDetails.action === 'Blocked' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {anomaly.anomalyDetails.action}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status Code:</span>
                        <div className={`font-mono ${
                          anomaly.anomalyDetails.statusCode === '403' ? 'text-red-600' : 'text-gray-800'
                        }`}>
                          {anomaly.anomalyDetails.statusCode}
                        </div>
                      </div>
                    </div>

                    {/* Full Log Entry (expandable) */}
                    <details className="mt-3">
                      <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                        View Full Log Entry
                      </summary>
                      <div className="mt-2 bg-white rounded border p-3">
                        <pre className="text-xs text-gray-700 overflow-x-auto">
                          {JSON.stringify(anomaly.logEntry, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
