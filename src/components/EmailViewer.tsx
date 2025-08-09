import React, { useState, useEffect, useRef } from 'react';
import { Clock, Sparkles, Calendar, CheckCircle2, Mail, User, AlertTriangle, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

interface EmailSummary {
  summary: string;
  priority: number;
  actionItems: string[];
}

interface EmailViewerProps {
  email: any | null;
  onGenerateSummary?: (email: any) => Promise<EmailSummary>;
  onCreateReminder?: (email: any, remindAt: Date) => Promise<void>;
  isLoading?: boolean;
}

export const EmailViewer: React.FC<EmailViewerProps> = ({ 
  email, 
  onGenerateSummary, 
  onCreateReminder,
  isLoading = false
}) => {
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderTime, setReminderTime] = useState('1h');
  const [reminderCreated, setReminderCreated] = useState(false);
  const [showImages, setShowImages] = useState(true);
  const [processedContent, setProcessedContent] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Enhanced CSS styles for direct HTML rendering
  const emailContentStyles = `
    .email-content-display {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      max-width: 80%;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .email-content-display * {
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .email-content-display h1, 
    .email-content-display h2, 
    .email-content-display h3, 
    .email-content-display h4, 
    .email-content-display h5, 
    .email-content-display h6 {
      margin: 1.2em 0 0.5em 0;
      font-weight: 600;
      line-height: 1.3;
      color: #1a1a1a;
    }

    .email-content-display h1 { font-size: 1.8em; }
    .email-content-display h2 { font-size: 1.5em; }
    .email-content-display h3 { font-size: 1.3em; }
    .email-content-display h4 { font-size: 1.1em; }
    .email-content-display h5 { font-size: 1em; }
    .email-content-display h6 { font-size: 0.9em; }

    .email-content-display p {
      margin: 0.8em 0;
      line-height: 1.6;
    }

    .email-content-display a {
      color: #0066cc !important;
      text-decoration: none !important;
      word-break: break-all !important;
      overflow-wrap: break-word !important;
      transition: all 0.2s ease;
    }

    .email-content-display a:hover {
      color: #004499 !important;
      text-decoration: underline !important;
      background-color: rgba(0, 102, 204, 0.1);
      padding: 2px 4px;
      border-radius: 3px;
      margin: -2px -4px;
    }

    .email-content-display a[href*="linkedin.com"],
    .email-content-display a[href*="tracking"],
    .email-content-display a[href*="utm_"],
    .email-content-display a[href*="?"] {
      word-break: break-all !important;
      overflow-wrap: anywhere !important;
      font-size: 0.9em;
      background-color: #f8f9fa;
      padding: 4px 6px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      margin: 2px 0;
      display: inline-block;
      max-width: 100%;
    }

    .email-content-display img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      margin: 10px 0;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .email-content-display table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse;
      margin: 15px 0;
      background-color: white;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .email-content-display th,
    .email-content-display td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
    }

    .email-content-display th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #333;
    }

    .email-content-display ul,
    .email-content-display ol {
      margin: 10px 0;
      padding-left: 25px;
    }

    .email-content-display li {
      margin: 4px 0;
      line-height: 1.5;
    }

    .email-content-display blockquote {
      margin: 15px 0;
      padding: 10px 15px;
      border-left: 4px solid #0066cc;
      background-color: #f8f9fa;
      border-radius: 0 4px 4px 0;
      font-style: italic;
      color: #555;
    }

    .email-content-display pre {
      background-color: #f4f4f4;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      overflow-x: auto;
      margin: 15px 0;
      font-family: 'Courier New', Consolas, monospace;
      font-size: 13px;
      line-height: 1.4;
    }

    .email-content-display code {
      background-color: #f4f4f4;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Courier New', Consolas, monospace;
      font-size: 13px;
    }

    .email-content-display iframe {
      max-width: 100% !important;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      margin: 15px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .email-content-display div {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .email-content-display hr {
      border: none;
      border-top: 2px solid #e0e0e0;
      margin: 20px 0;
    }

    .email-content-display .gmail_quote,
    .email-content-display .yahoo_quoted,
    .email-content-display .moz-cite-prefix {
      border-left: 3px solid #ccc;
      padding-left: 15px;
      margin: 15px 0;
      color: #666;
      font-style: italic;
    }

    .email-content-display .gmail_signature {
      border-top: 1px solid #e0e0e0;
      padding-top: 15px;
      margin-top: 20px;
      color: #666;
      font-size: 13px;
    }

    .email-content-display strong,
    .email-content-display b {
      font-weight: 600;
    }

    .email-content-display em,
    .email-content-display i {
      font-style: italic;
    }

    .email-content-display {
      overflow-x: hidden !important;
      overflow-y: auto;
    }

    .email-content-display * {
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
    }

    .email-content-display img[src=""],
    .email-content-display img:not([src]) {
      display: none;
    }
  `;

  // Inject styles when component mounts
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'email-content-display-styles';
    styleSheet.textContent = emailContentStyles;
    
    const existingStyles = document.getElementById('email-content-display-styles');
    if (existingStyles) {
      document.head.removeChild(existingStyles);
    }
    
    document.head.appendChild(styleSheet);
    
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  // Reset summary when email changes
  useEffect(() => {
    setSummary(null);
    setReminderCreated(false);
    setShowImages(true);
  }, [email?.id]);

  // Process email content when email changes
  useEffect(() => {
    if (email?.body) {
      setProcessedContent(processEmailContent(email.body));
    }
  }, [email?.body, showImages]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key.toLowerCase() === 's' && email && onGenerateSummary) {
        e.preventDefault();
        handleGenerateSummary();
      }
      
      if (e.key.toLowerCase() === 'r' && email && onCreateReminder) {
        e.preventDefault();
        setShowReminderDialog(true);
      }

      if (e.key.toLowerCase() === 'i' && email) {
        e.preventDefault();
        setShowImages(!showImages);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [email, onGenerateSummary, onCreateReminder, showImages]);

  // Handle link clicks
  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))) {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('click', handleLinkClick);
      return () => {
        contentElement.removeEventListener('click', handleLinkClick);
      };
    }
  }, [processedContent]);

  const processEmailContent = (body: string): string => {
    if (!body) return '<p>No content available</p>';

    let content = body;

    // Remove potentially dangerous elements
    content = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    // Fix malformed HTML entities
    content = content.replace(/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-f]+;)/gi, '&amp;');

    // Enhance all links to open in new tabs
    content = content.replace(
      /<a\s+([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
      (match, before, href, after) => {
        if (!after.includes('target=')) {
          return `<a ${before}href="${href}" target="_blank" rel="noopener noreferrer"${after}>`;
        }
        return match;
      }
    );

    // Handle images based on showImages setting
    if (!showImages) {
      let imageCount = 0;
      content = content.replace(
        /<img([^>]*?)>/gi,
        (match) => {
          imageCount++;
          const altMatch = match.match(/alt=["']([^"']*?)["']/i);
          const altText = altMatch ? altMatch[1] : `Image ${imageCount}`;
          
          return `<div style="display: flex; align-items: center; gap: 12px; padding: 12px; margin: 12px 0; background-color: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; min-height: 80px;">
            <div style="flex-shrink: 0; padding: 8px; background-color: #e9ecef; border-radius: 6px;">
              <svg style="width: 24px; height: 24px; color: #6c757d;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div style="flex: 1; min-width: 0;">
              <p style="margin: 0; font-size: 14px; font-weight: 500; color: #495057;">Image blocked for privacy</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6c757d;">${altText}</p>
            </div>
          </div>`;
        }
      );
    } else {
      // Process images for loading
      content = content.replace(
        /<img([^>]*?)>/gi,
        (match) => {
          return match.replace(/<img/, '<img style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;"');
        }
      );
    }

    // Handle iframes
    if (!showImages) {
      content = content.replace(
        /<iframe([^>]*?)>/gi,
        () => {
          return `<div style="display: flex; align-items: center; gap: 12px; padding: 16px; margin: 16px 0; background-color: #e3f2fd; border: 2px dashed #90caf9; border-radius: 8px; min-height: 120px;">
            <div style="flex-shrink: 0; padding: 12px; background-color: #bbdefb; border-radius: 6px;">
              <svg style="width: 32px; height: 32px; color: #1976d2;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div style="flex: 1; min-width: 0;">
              <p style="margin: 0; font-size: 14px; font-weight: 500; color: #1565c0;">Embedded content blocked</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #1976d2;">Click "Show Content" to load embedded media</p>
            </div>
          </div>`;
        }
      );
    }

    return content;
  };

  const countImages = (content: string): number => {
    const imgMatches = content.match(/<img[^>]*?>/gi);
    const iframeMatches = content.match(/<iframe[^>]*?>/gi);
    return (imgMatches ? imgMatches.length : 0) + (iframeMatches ? iframeMatches.length : 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 bg-white">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-gray-300 rounded-full border-t-gray-900 animate-spin" />
          <p className="text-gray-500">Loading email...</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center flex-1 bg-white">
        <div className="max-w-md text-center text-gray-500">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="mb-4 text-lg">Select an email to read</p>
          <div className="p-4 space-y-2 text-sm rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-2">
              <kbd className="px-2 py-1 font-mono text-xs bg-white border rounded">↑↓</kbd>
              <span>Navigate emails</span>
            </div>
            {onGenerateSummary && (
              <div className="flex items-center justify-center gap-2">
                <kbd className="px-2 py-1 font-mono text-xs bg-white border rounded">S</kbd>
                <span>Generate AI summary</span>
              </div>
            )}
            {onCreateReminder && (
              <div className="flex items-center justify-center gap-2">
                <kbd className="px-2 py-1 font-mono text-xs bg-white border rounded">R</kbd>
                <span>Set reminder</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <kbd className="px-2 py-1 font-mono text-xs bg-white border rounded">I</kbd>
              <span>Toggle images</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleGenerateSummary = async () => {
    if (isLoadingSummary || !email || !onGenerateSummary) return;
    
    setIsLoadingSummary(true);
    try {
      const result = await onGenerateSummary(email);
      setSummary(result);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleCreateReminder = async () => {
    if (!email || !onCreateReminder) return;

    const now = new Date();
    let remindAt = new Date(now);

    switch (reminderTime) {
      case '1h':
        remindAt.setHours(now.getHours() + 1);
        break;
      case '4h':
        remindAt.setHours(now.getHours() + 4);
        break;
      case '1d':
        remindAt.setDate(now.getDate() + 1);
        break;
      case '3d':
        remindAt.setDate(now.getDate() + 3);
        break;
      case '1w':
        remindAt.setDate(now.getDate() + 7);
        break;
      default:
        remindAt.setHours(now.getHours() + 1);
    }

    try {
      await onCreateReminder(email, remindAt);
      setShowReminderDialog(false);
      setReminderCreated(true);
      setTimeout(() => setReminderCreated(false), 3000);
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 4) return <AlertTriangle className="w-4 h-4" />;
    if (priority >= 3) return <Clock className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const extractSenderInfo = (from: string) => {
    const match = from.match(/^(.*?)\s*<(.+?)>$/) || from.match(/^(.+)$/);
    if (match && match.length > 2) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: match ? match[1].trim() : from, email: from };
  };

  const senderInfo = extractSenderInfo(email.from);
  const imageCount = countImages(email.body || '');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {!email.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              <h1 className="text-xl font-semibold leading-tight text-gray-900">
                {email.subject}
              </h1>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{senderInfo.name}</span>
                {senderInfo.email !== senderInfo.name && (
                  <span className="text-gray-500">({senderInfo.email})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(email.date)}</span>
              </div>
              {imageCount > 0 && (
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>{imageCount} media item{imageCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {imageCount > 0 && (
              <button
                onClick={() => setShowImages(!showImages)}
                className={`inline-flex items-center gap-2 px-4 py-2 transition-colors duration-200 border rounded-lg ${
                  showImages 
                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {showImages ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {showImages ? 'Hide Content' : 'Show Content'}
              </button>
            )}
            
            {onGenerateSummary && (
              <button
                onClick={handleGenerateSummary}
                disabled={isLoadingSummary}
                className="inline-flex items-center gap-2 px-4 py-2 text-white transition-colors duration-200 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingSummary ? (
                  <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isLoadingSummary ? 'Generating...' : 'AI Summary'}
              </button>
            )}
            
            {onCreateReminder && (
              <button
                onClick={() => setShowReminderDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Clock className="w-4 h-4" />
                Reminder
              </button>
            )}
          </div>
        </div>

        {/* Images/Media notification banner */}
        {imageCount > 0 && !showImages && (
          <div className="flex items-center justify-between p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-800">
                This email contains {imageCount} media item{imageCount !== 1 ? 's' : ''} (blocked for privacy)
              </span>
            </div>
            <button
              onClick={() => setShowImages(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Show Content
            </button>
          </div>
        )}

        {/* Success message for reminder */}
        {reminderCreated && (
          <div className="flex items-center gap-2 p-3 mb-4 border border-green-200 rounded-lg bg-green-50">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">Reminder created successfully!</span>
          </div>
        )}

        {/* AI Summary */}
        {summary && (
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">AI Summary</h3>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(summary.priority)}`}>
                {getPriorityIcon(summary.priority)}
                Priority {summary.priority}
              </div>
            </div>
            
            <div className="prose-sm prose max-w-none">
              <p className="mb-3 leading-relaxed text-gray-700">{summary.summary}</p>
              
              {summary.actionItems && summary.actionItems.length > 0 && (
                <div className="p-3 rounded-lg bg-gray-50">
                  <h4 className="flex items-center gap-2 mb-2 font-medium text-gray-900">
                    <CheckCircle2 className="w-4 h-4" />
                    Action Items:
                  </h4>
                  <ul className="space-y-2">
                    {summary.actionItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Email Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-none">
          <div 
            ref={contentRef}
            className="email-content-display"
            dangerouslySetInnerHTML={{ 
              __html: processedContent || email.snippet || '<p>No content available</p>' 
            }}
          />
        </div>
      </div>

      {/* Reminder Dialog */}
      {showReminderDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowReminderDialog(false)}>
          <div className="p-6 bg-white rounded-lg shadow-xl w-80" onClick={e => e.stopPropagation()}>
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
              <Clock className="w-5 h-5" />
              Set Reminder
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Remind me about "{email.subject.substring(0, 30)}..." in:
                </label>
                <select
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1h">1 hour</option>
                  <option value="4h">4 hours</option>
                  <option value="1d">Tomorrow</option>
                  <option value="3d">In 3 days</option>
                  <option value="1w">Next week</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCreateReminder}
                  className="flex items-center justify-center flex-1 gap-2 px-4 py-2 text-white transition-colors duration-200 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Clock className="w-4 h-4" />
                  Set Reminder
                </button>
                <button
                  onClick={() => setShowReminderDialog(false)}
                  className="flex-1 px-4 py-2 transition-colors duration-200 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};