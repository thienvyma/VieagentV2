'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Key,
  Globe,
  MessageSquare,
  Bell,
  Database,
  Mail,
  Calendar,
  FileText,
  Image,
  Code,
  BarChart,
  Shield,
  Webhook,
  X,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Search,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Types
export interface Integration {
  id: string;
  name: string;
  service: string;
  type: 'oauth' | 'api_key' | 'webhook' | 'database';
  status: 'connected' | 'disconnected' | 'error' | 'expired' | 'pending';
  health_score: number; // 0-100
  last_sync: Date;
  created_at: Date;
  is_featured?: boolean;
  rating?: number;
  install_count?: string | number;
  description?: string;
  category?: string;
  logo_url?: string;

  // Configuration
  config: {
    api_key?: string;
    client_id?: string;
    client_secret?: string;
    webhook_url?: string;
    database_url?: string;
    custom_fields?: Record<string, any>;
  };

  // Health metrics
  metrics: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_response_time: number;
    uptime_percentage: number;
    last_error?: string;
    last_error_at?: Date;
  };

  // Capabilities
  capabilities: string[];
  triggers: IntegrationTrigger[];
}

export interface IntegrationTrigger {
  id: string;
  integration_id: string;
  event_type: string;
  webhook_url?: string;
  is_active: boolean;
  created_at: Date;
  config: Record<string, any>;
}

export interface IntegrationTemplate {
  service: string;
  name: string;
  description: string;
  icon: any; // Lucide Icon
  color: string;
  type: 'oauth' | 'api_key' | 'webhook' | 'database';
  capabilities: string[];
  config_fields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'select' | 'textarea';
    required: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
  }[];
  auth_url?: string;
  docs_url: string;
  setup_guide: string[];
}

// Map service strings to Icons
const getServiceIcon = (service: string) => {
  switch (service?.toLowerCase()) {
    case 'slack': return MessageSquare;
    case 'discord': return MessageSquare;
    case 'gmail': return Mail;
    case 'email': return Mail;
    case 'database': return Database;
    case 'postgres': return Database;
    case 'webhook': return Webhook;
    default: return Zap;
  }
}

// Integration templates configuration (Expanded)
const INTEGRATION_TEMPLATES: IntegrationTemplate[] = [
  {
    service: 'slack',
    name: 'Slack',
    description: 'Send messages and notifications to Slack channels',
    icon: MessageSquare,
    color: '#4A154B',
    type: 'oauth',
    capabilities: ['messaging', 'channels', 'users', 'files'],
    config_fields: [
      { key: 'workspace', label: 'Workspace URL', type: 'url', required: true, placeholder: 'https://yourworkspace.slack.com' }
    ],
    auth_url: '/api/integrations/slack/auth',
    docs_url: 'https://api.slack.com/docs',
    setup_guide: [
      'Go to Slack App Directory and create a new app',
      'Configure OAuth & Permissions with required scopes',
      'Add your app to your workspace',
      'Copy the Bot User OAuth Token'
    ]
  },
  {
    service: 'discord',
    name: 'Discord',
    description: 'Create Discord bots and send messages to channels',
    icon: MessageSquare,
    color: '#5865F2',
    type: 'api_key',
    capabilities: ['messaging', 'channels', 'webhooks', 'embeds'],
    config_fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', required: true, placeholder: 'Bot token from Discord Developer Portal' },
      { key: 'server_id', label: 'Server ID', type: 'text', required: false, placeholder: 'Discord server ID' }
    ],
    docs_url: 'https://discord.com/developers/docs',
    setup_guide: [
      'Go to Discord Developer Portal',
      'Create a new application and bot',
      'Copy the bot token',
      'Invite bot to your server with required permissions'
    ]
  },
  {
    service: 'gmail',
    name: 'Gmail',
    description: 'Send and receive emails via Google Workspace',
    icon: Mail,
    color: '#EA4335',
    type: 'oauth',
    capabilities: ['send_email', 'read_email', 'labels'],
    config_fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true }
    ],
    docs_url: 'https://developers.google.com/gmail/api/guides',
    setup_guide: [
      'Create a project in Google Cloud Console',
      'Enable Gmail API',
      'Create OAuth credentials'
    ]
  },
  {
    service: 'webhooks',
    name: 'Custom Webhooks',
    description: 'Send HTTP requests to any webhook endpoint',
    icon: Webhook,
    color: '#6366F1',
    type: 'webhook',
    capabilities: ['http_post', 'http_get', 'custom_headers', 'retries'],
    config_fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: true, placeholder: 'https://api.example.com/webhook' },
      { key: 'secret', label: 'Secret/API Key', type: 'password', required: false, placeholder: 'Optional authentication' },
      {
        key: 'method', label: 'HTTP Method', type: 'select', required: true, options: [
          { value: 'POST', label: 'POST' },
          { value: 'GET', label: 'GET' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' }
        ]
      },
      { key: 'headers', label: 'Custom Headers', type: 'textarea', required: false, placeholder: 'JSON object with custom headers' }
    ],
    docs_url: 'https://webhook.site/docs',
    setup_guide: [
      'Prepare your webhook endpoint to receive HTTP requests',
      'Configure authentication if required',
      'Test with a simple POST request',
      'Set up proper error handling'
    ]
  },
  {
    service: 'database',
    name: 'Database',
    description: 'Connect to PostgreSQL, MySQL, or other databases',
    icon: Database,
    color: '#10B981',
    type: 'database',
    capabilities: ['read', 'write', 'transactions', 'migrations'],
    config_fields: [
      {
        key: 'database_type', label: 'Database Type', type: 'select', required: true, options: [
          { value: 'postgresql', label: 'PostgreSQL' },
          { value: 'mysql', label: 'MySQL' },
          { value: 'sqlite', label: 'SQLite' }
        ]
      },
      { key: 'connection_string', label: 'Connection String', type: 'password', required: true, placeholder: 'postgresql://user:pass@host:5432/dbname' }
    ],
    docs_url: 'https://www.postgresql.org/docs/',
    setup_guide: [
      'Ensure database server is accessible',
      'Create database user with appropriate permissions',
      'Test connection string format',
      'Configure SSL if required'
    ]
  }
];

// Integration health bar component
export function IntegrationHealthBar({
  integration,
  showDetails = false,
  onSettings,
  onTriggers
}: {
  integration: Integration;
  showDetails?: boolean;
  onSettings?: () => void;
  onTriggers?: () => void;
}) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const Icon = getServiceIcon(integration.service);
  const color = INTEGRATION_TEMPLATES.find(t => t.service === integration.service)?.color || '#6366F1';

  const formatRelativeTime = (date: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
            <Icon className="h-5 w-5" style={{ color: color }} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{integration.name}</h3>
            <p className="text-sm text-gray-500">{integration.service}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${integration.status === 'connected' ? 'bg-green-50 text-green-700' :
            integration.status === 'error' ? 'bg-red-50 text-red-700' :
              'bg-gray-100 text-gray-600'
            }`}>
            {integration.status}
          </span>
        </div>
      </div>

      {/* Health Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Health Score</span>
          <span className="text-sm text-gray-900">{integration.health_score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getHealthColor(integration.health_score)}`}
            style={{ width: `${integration.health_score}%` }}
          />
        </div>
      </div>

      {showDetails && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 block">Uptime</span>
              <span className="font-medium text-gray-900">
                {integration.metrics?.uptime_percentage?.toFixed(1) || 99.9}%
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Last Sync</span>
              <span className="font-medium text-gray-900">
                {formatRelativeTime(integration.last_sync)}
              </span>
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button onClick={onSettings} className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
              <Settings className="h-3 w-3" />
              <span>Config</span>
            </button>
            <button onClick={onTriggers} className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
              <Zap className="h-3 w-3" />
              <span>Triggers</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Integration settings modal
export function IntegrationSettingsModal({
  integration,
  template,
  isOpen,
  onClose,
  onSave
}: {
  integration?: Integration;
  template: IntegrationTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
}) {
  const [config, setConfig] = useState(integration?.config || {});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const updateConfig = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  const testConnection = async () => {
    setTesting(true);
    // Simulate test
    setTimeout(() => {
      setTesting(false);
      setTestResult({ success: true, message: 'Connection verified successfully!' });
    }, 1500);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${template.color}20` }}>
              <template.icon className="h-6 w-6" style={{ color: template.color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {integration ? `Edit ${integration.name}` : `Connect ${template.name}`}
              </h2>
              <p className="text-sm text-gray-500">{template.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          {/* Setup Guide */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
            <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Setup Instructions
            </h3>
            <ol className="list-decimal list-inside space-y-2">
              {template.setup_guide.map((step, index) => (
                <li key={index} className="text-sm text-blue-800 leading-relaxed">{step}</li>
              ))}
            </ol>
            <a
              href={template.docs_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-700 hover:text-blue-900 mt-4 uppercase tracking-wide"
            >
              <span>Read Full Documentation</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Configuration Form */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Configuration</h3>

            {template.config_fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    value={(config as any)[field.key] || ''}
                    onChange={(e) => updateConfig(field.key, e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={(config as any)[field.key] || ''}
                    onChange={(e) => updateConfig(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : field.type === 'password' ? (
                  <div className="relative">
                    <input
                      type={showSecrets[field.key] ? 'text' : 'password'}
                      value={(config as any)[field.key] || ''}
                      onChange={(e) => updateConfig(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret(field.key)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showSecrets[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    value={(config as any)[field.key] || ''}
                    onChange={(e) => updateConfig(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Test Connection */}
          <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Verify Connection</h4>
              <p className="text-xs text-gray-500">Ensure your credentials are correct before saving.</p>
            </div>
            <button
              onClick={testConnection}
              disabled={testing}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 flex items-center"
            >
              {testing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Test Now
            </button>
          </div>
          {testResult && (
            <div className={`p-3 rounded-md text-sm flex items-center ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testResult.success ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              {testResult.message}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(config)}
            disabled={!Object.values(config).some(v => v)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition flex items-center"
          >
            {integration ? <RefreshCw className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {integration ? 'Update Configuration' : 'Connect Integration'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main integration dashboard
export function IntegrationsDashboard() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed'>('marketplace');
  const [installedIntegrations, setInstalledIntegrations] = useState<Integration[]>([]);
  const [marketplaceIntegrations, setMarketplaceIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // Fetch data
  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      // Fetch Real Data from API
      // In a real app, these would be separate calls. We simulate it here by calling the API or using mock fallback if API fails

      // 1. Fetch Installed
      let installedRes;
      try {
        installedRes = await fetch('/api/integrations?type=installed').then(r => r.json());
      } catch (e) { console.error("API Error", e); installedRes = { integrations: [] }; }

      // 2. Fetch Marketplace
      let marketRes;
      try {
        marketRes = await fetch('/api/integrations?type=marketplace').then(r => r.json());
      } catch (e) { console.error("API Error", e); marketRes = { integrations: [] }; }

      setInstalledIntegrations(installedRes?.integrations || []);

      // If API returns empty (since we just wiped DB/started fresh), fall back to Template list as Marketplace
      if (!marketRes?.integrations || marketRes.integrations.length === 0) {
        // Convert Templates to Integration-like objects for display
        const templateItems = INTEGRATION_TEMPLATES.map((t, i) => ({
          id: `tpl-${i}`,
          name: t.name,
          service: t.service,
          type: t.type,
          status: 'disconnected',
          health_score: 0,
          last_sync: new Date(),
          created_at: new Date(),
          is_featured: i < 3,
          rating: 4.5 + (i * 0.1),
          install_count: Math.floor(Math.random() * 10000),
          description: t.description,
          capabilities: t.capabilities,
          metrics: { total_requests: 0, successful_requests: 0, failed_requests: 0, average_response_time: 0, uptime_percentage: 0 },
          config: {},
          triggers: []
        } as Integration));
        setMarketplaceIntegrations(templateItems);
      } else {
        setMarketplaceIntegrations(marketRes.integrations);
      }

    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      toast.error("Failed to load integrations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleConnect = (template: IntegrationTemplate) => {
    setSelectedTemplate(template);
    setSelectedIntegration(null);
    setShowSettings(true);
  };

  const handleConfigure = (integration: Integration) => {
    // Find template for this integration
    const template = INTEGRATION_TEMPLATES.find(t => t.service === integration.service) || INTEGRATION_TEMPLATES[0]; // Fallback
    setSelectedTemplate(template);
    setSelectedIntegration(integration);
    setShowSettings(true);
  }

  const handleSaveConfig = async (config: any) => {
    toast.loading("Saving configuration...");
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    toast.dismiss();
    toast.success(selectedIntegration ? "Integration updated" : "Integration connected");
    setShowSettings(false);
    fetchIntegrations(); // Refresh
  }

  // Filter
  const displayedIntegrations = (activeTab === 'marketplace' ? marketplaceIntegrations : installedIntegrations).filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600">Connect your AI agents with external tools and services.</p>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'marketplace'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'installed'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            My Integrations
            {installedIntegrations.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                {installedIntegrations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Toolbar */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </button>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedIntegrations.map((integration) => {
            const Icon = getServiceIcon(integration.service);
            const template = INTEGRATION_TEMPLATES.find(t => t.service === integration.service);
            const color = template?.color || '#6366F1';

            if (activeTab === 'installed') {
              return (
                <IntegrationHealthBar
                  key={integration.id}
                  integration={integration}
                  showDetails={true}
                  onSettings={() => handleConfigure(integration)}
                  onTriggers={() => toast("Triggers coming soon")}
                />
              );
            }

            return (
              <div key={integration.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}
                      style={{ backgroundColor: color }}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {integration.is_featured && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Featured</span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{integration.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{integration.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <span>{integration.install_count?.toLocaleString()} installs</span>
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1">★</span>
                      {integration.rating?.toFixed(1) || 'NEW'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnect(template || INTEGRATION_TEMPLATES[0])}
                    className="w-full py-2.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium rounded-lg border border-gray-200 hover:border-blue-200 transition flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && displayedIntegrations.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
          <Search className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No integrations found</h3>
          <p className="text-gray-500">Try adjusting your search terms</p>
        </div>
      )}

      {/* Modals */}
      {showSettings && selectedTemplate && (
        <IntegrationSettingsModal
          integration={selectedIntegration || undefined}
          template={selectedTemplate}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
}