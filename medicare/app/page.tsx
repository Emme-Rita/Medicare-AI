'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Send, Copy, Search, Globe, AlertCircle, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

// Types
type Language = 'en' | 'fr';
type Tab = 'welcome' | 'chat' | 'analysis' | 'research';
type Message = { role: 'user' | 'ai'; content: string; timestamp: Date };
type AnalysisSection = { summary: string; keyFindings: string[]; recommendations: string[]; nextSteps: string[] };

const API_BASE = 'https://medicare-ai-5.onrender.com';

// Translations
const translations = {
  en: {
    appName: 'Medicare AI',
    tagline: 'Your Intelligent Medical Assistant',
    welcome: 'Welcome',
    chat: 'Chat',
    analysis: 'Analysis',
    research: 'Research',
    getStarted: 'Get Started',
    disclaimer: '⚠️ For informational purposes only - Always consult healthcare professionals',
    features: {
      title: 'Powerful Features for Your Health',
      chat: 'AI Chat Assistant',
      chatDesc: 'Get instant answers to your medical questions',
      analysis: 'Document Analysis',
      analysisDesc: 'Upload lab reports and medical documents',
      research: 'Medical Research',
      researchDesc: 'Access verified medical information',
    },
    chatPlaceholder: 'Ask a medical question...',
    suggestedQuestions: ['Symptoms of malaria?', 'What causes headaches?', 'Diabetes management tips'],
    uploadText: 'Drag & drop files or click to upload',
    captureText: 'Capture with Camera',
    extractedText: 'Extracted Text',
    analysisResults: 'Analysis Results',
    summary: 'Summary',
    keyFindings: 'Key Findings',
    recommendations: 'Recommendations',
    nextSteps: 'Next Steps',
    searchPlaceholder: 'Search medical topics...',
    researchTopics: ['Diabetes guidelines', 'Hypertension treatment', 'Malaria prevention'],
    copySuccess: 'Copied to clipboard!',
    errorOccurred: 'An error occurred. Please try again.',
    loading: 'Processing...',
    aiSummary: 'AI-Generated Summary',
  },
  fr: {
    appName: 'Medicare AI',
    tagline: 'Votre Assistant Médical Intelligent',
    welcome: 'Accueil',
    chat: 'Discussion',
    analysis: 'Analyse',
    research: 'Recherche',
    getStarted: 'Commencer',
    disclaimer: '⚠️ À titre informatif uniquement - Consultez toujours des professionnels de santé',
    features: {
      title: 'Fonctionnalités Puissantes pour Votre Santé',
      chat: 'Assistant Chat IA',
      chatDesc: 'Obtenez des réponses instantanées à vos questions médicales',
      analysis: 'Analyse de Documents',
      analysisDesc: 'Téléchargez des rapports de laboratoire et documents médicaux',
      research: 'Recherche Médicale',
      researchDesc: 'Accédez à des informations médicales vérifiées',
    },
    chatPlaceholder: 'Posez une question médicale...',
    suggestedQuestions: ['Symptômes du paludisme?', 'Qu\'est-ce qui cause les maux de tête?', 'Conseils de gestion du diabète'],
    uploadText: 'Glissez-déposez des fichiers ou cliquez pour télécharger',
    captureText: 'Capturer avec la Caméra',
    extractedText: 'Texte Extrait',
    analysisResults: 'Résultats de l\'Analyse',
    summary: 'Résumé',
    keyFindings: 'Principales Conclusions',
    recommendations: 'Recommandations',
    nextSteps: 'Prochaines Étapes',
    searchPlaceholder: 'Rechercher des sujets médicaux...',
    researchTopics: ['Directives sur le diabète', 'Traitement de l\'hypertension', 'Prévention du paludisme'],
    copySuccess: 'Copié dans le presse-papiers!',
    errorOccurred: 'Une erreur s\'est produite. Veuillez réessayer.',
    loading: 'Traitement en cours...',
    aiSummary: 'Résumé Généré par IA',
  },
};

export default function MedicareAI() {
  const [activeTab, setActiveTab] = useState<Tab>('welcome');
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [extractedText, setExtractedText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisSection | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({ summary: true, keyFindings: true, recommendations: true, nextSteps: true });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(t.copySuccess, 'success');
  };

  const handleSendMessage = async (message?: string) => {
    const msgToSend = message || inputMessage;
    if (!msgToSend.trim()) return;

    const userMessage: Message = { role: 'user', content: msgToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgToSend, language }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const aiMessage: Message = { role: 'ai', content: data.response || 'No response received', timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      showToast(t.errorOccurred, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to analyze document');

      const data = await response.json();
      setExtractedText(data.extractedText || '');
      setAnalysis({
        summary: data.summary || 'No summary available',
        keyFindings: data.keyFindings || [],
        recommendations: data.recommendations || [],
        nextSteps: data.nextSteps || [],
      });
    } catch (error) {
      showToast(t.errorOccurred, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/research?q=${encodeURIComponent(searchTerm)}&lang=${language}`);

      if (!response.ok) throw new Error('Failed to search');

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      showToast(t.errorOccurred, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏥</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.appName}</h1>
                <p className="text-blue-100 text-sm">{t.tagline}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {(['welcome', 'chat', 'analysis', 'research'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors relative ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t[tab]}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 animate-pulse" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Disclaimer */}
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-800">{t.disclaimer}</p>
          </div>
        </div>

        {/* Welcome Tab */}
        {activeTab === 'welcome' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl p-12 text-white">
              <h2 className="text-4xl font-bold mb-4">Welcome to {t.appName}</h2>
              <p className="text-xl text-blue-100 mb-8">{t.tagline}</p>
              <button
                onClick={() => setActiveTab('chat')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                {t.getStarted} →
              </button>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.features.title}</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.features.chat}</h4>
                  <p className="text-gray-600">{t.features.chatDesc}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.features.analysis}</h4>
                  <p className="text-gray-600">{t.features.analysisDesc}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">🔬</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.features.research}</h4>
                  <p className="text-gray-600">{t.features.researchDesc}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-gray-500">Start a conversation with our AI assistant</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-lg px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {t.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t.chatPlaceholder}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-600 transition-colors cursor-pointer bg-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t.uploadText}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>

              <div className="border-2 border-gray-300 rounded-xl p-12 text-center hover:border-blue-600 transition-colors cursor-pointer bg-white">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t.captureText}</p>
              </div>
            </div>

            {isLoading && (
              <div className="bg-white rounded-xl p-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">{t.loading}</p>
              </div>
            )}

            {extractedText && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t.extractedText}</h3>
                  <button
                    onClick={() => copyToClipboard(extractedText)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{extractedText}</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">{t.analysisResults}</h3>

                {(['summary', 'keyFindings', 'recommendations', 'nextSteps'] as const).map((section) => (
                  <div key={section} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <button
                      onClick={() => toggleSection(section)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="text-lg font-semibold text-gray-900">{t[section]}</h4>
                      {expandedSections[section] ? (
                        <ChevronUp className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                    {expandedSections[section] && (
                      <div className="px-6 pb-6">
                        {section === 'summary' ? (
                          <p className="text-gray-700">{analysis[section]}</p>
                        ) : (
                          <ul className="space-y-2">
                            {analysis[section].map((item: string, idx: number) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Research Tab */}
        {activeTab === 'research' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t.searchPlaceholder}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={() => handleSearch()}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {t.researchTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(topic)}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {isLoading && (
              <div className="bg-white rounded-xl p-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">{t.loading}</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-4">
                {searchResults[0]?.aiSummary && (
                  <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-2xl">🤖</span>
                      <h3 className="text-lg font-semibold text-gray-900">{t.aiSummary}</h3>
                    </div>
                    <p className="text-gray-700">{searchResults[0].aiSummary}</p>
                  </div>
                )}

                {searchResults.map((result, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{result.title}</h4>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {result.source || 'Medical Source'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{result.description}</p>
                    <div className="flex items-center justify-between">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Read More →
                      </a>
                      <button
                        onClick={() => copyToClipboard(result.description)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Language Toggle Button */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 z-50"
      >
        <Globe className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 text-xl">{language === 'en' ? '🇬🇧' : '🇫🇷'}</span>
      </button>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-24 right-6 bg-white rounded-lg shadow-xl p-4 flex items-center space-x-3 animate-slide-up z-50">
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <p className="text-gray-900">{toast.message}</p>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}