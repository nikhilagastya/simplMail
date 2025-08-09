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
  const [showImages, setShowImages] = useState(false);
  const [processedContent, setProcessedContent] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset summary when email changes
  useEffect(() => {
    setSummary(null);
    setReminderCreated(false);
    setShowImages(false);
  }, [email?.id]);

  // Process email content when email changes or showImages toggles
  useEffect(() => {
    if (email?.body) {
      setProcessedContent(processEmailContent(email.body, showImages));
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

  const processEmailContent = (body: string, loadImages: boolean): string => {
    let content = body;

    // First, preserve existing HTML structure and formatting
    // Don't aggressively remove whitespace that might be important for formatting
    content = content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Only collapse excessive line breaks (3+)
      .trim();

    // Preserve indentation by converting spaces to non-breaking spaces in certain contexts
    content = content.replace(/^( {2,})/gm, (match) => {
      return match.replace(/ /g, '&nbsp;');
    });

    // Handle preformatted text and code blocks
    content = content.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/gi, ( attrs, innerContent) => {
      // Preserve all whitespace in pre tags
      return `<pre${attrs} class="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre">${innerContent}</pre>`;
    });

    // Handle code tags
    content = content.replace(/<code([^>]*)>([\s\S]*?)<\/code>/gi, ( attrs, innerContent) => {
      return `<code${attrs} class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">${innerContent}</code>`;
    });

    // Handle blockquotes
    content = content.replace(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/gi, ( attrs, innerContent) => {
      return `<blockquote${attrs} class="border-l-4 border-gray-300 pl-4 my-4 text-gray-700 italic">${innerContent}</blockquote>`;
    });

    // Handle lists with proper styling
    content = content.replace(/<ul([^>]*)>/gi, '<ul$1 class="list-disc list-inside my-4 space-y-1">');
    content = content.replace(/<ol([^>]*)>/gi, '<ol$1 class="list-decimal list-inside my-4 space-y-1">');
    content = content.replace(/<li([^>]*)>/gi, '<li$1 class="ml-4">');

    // Handle tables
    content = content.replace(/<table([^>]*)>/gi, '<div class="overflow-x-auto my-4"><table$1 class="min-w-full border border-gray-200 rounded-lg">');
    content = content.replace(/<\/table>/gi, '</table></div>');
    content = content.replace(/<th([^>]*)>/gi, '<th$1 class="px-4 py-2 bg-gray-100 border-b border-gray-200 text-left font-semibold">');
    content = content.replace(/<td([^>]*)>/gi, '<td$1 class="px-4 py-2 border-b border-gray-200">');

    // Handle paragraphs with proper spacing
    content = content.replace(/<p([^>]*)>/gi, '<p$1 class="my-3 leading-relaxed">');

    // Handle divs that might contain important spacing
    content = content.replace(/<div([^>]*?)style=["']([^"']*?)["']([^>]*)>/gi, ( beforeStyle, styleContent, afterStyle) => {
      // Preserve important styling like margins, padding, text-align
      const preservedStyles = styleContent
        .split(';')
        .filter((style:any) => {
          const prop = style.trim().split(':')[0]?.toLowerCase();
          return ['margin', 'padding', 'text-align', 'text-indent', 'white-space', 'display'].some(p => prop?.includes(p));
        })
        .join(';');
      
      return preservedStyles 
        ? `<div${beforeStyle} style="${preservedStyles}"${afterStyle}>`
        : `<div${beforeStyle}${afterStyle}>`;
    });

    // Handle URLs (but avoid breaking existing links)
    content = content.replace(
      /(?<!href=["'])https?:\/\/[^\s\n<>"']+(?!["'][^>]*>)/g, 
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline break-all">${url}</a>`
    );

    // Handle iframes with different content types
    if (loadImages) {
      content = content.replace(
        /<iframe([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
        ( beforeSrc, src, afterSrc) => {
          // Determine iframe type and styling
          const isVideo = src.includes('youtube') || src.includes('vimeo') || src.includes('video');
          const isMap = src.includes('maps.google') || src.includes('openstreetmap') || src.includes('mapbox');
          const isForm = src.includes('forms.') || src.includes('typeform') || src.includes('survey');
          const isSocial = src.includes('twitter') || src.includes('facebook') || src.includes('instagram') || src.includes('linkedin');
          
          let containerClass = 'my-4 rounded-lg border border-gray-200 overflow-hidden';
          let iframeClass = 'w-full border-0';
          let height = '400px';
          
          if (isVideo) {
            containerClass += ' aspect-video';
            iframeClass += ' h-full';
            height = 'auto';
          } else if (isMap) {
            height = '300px';
          } else if (isForm) {
            height = '600px';
          } else if (isSocial) {
            height = '500px';
          }
          
          // Security check for trusted domains
          const trustedDomains = [
            'youtube.com', 'youtu.be', 'vimeo.com',
            'google.com', 'maps.google.com',
            'openstreetmap.org', 'mapbox.com',
            'forms.gle', 'docs.google.com',
            'typeform.com', 'surveymonkey.com',
            'twitter.com', 'facebook.com',
            'linkedin.com', 'instagram.com'
          ];
          
          const isTrusted = trustedDomains.some(domain => src.includes(domain));
          
          if (!isTrusted) {
            return `<div class="flex items-center gap-3 p-4 my-4 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-lg">
              <div class="flex-shrink-0 p-2 bg-yellow-200 rounded-lg">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-yellow-800">Embedded content blocked</p>
                <p class="text-xs text-yellow-700 mt-1">Untrusted domain: ${new URL(src).hostname}</p>
                <a href="${src}" target="_blank" rel="noopener noreferrer" class="text-xs text-yellow-600 hover:text-yellow-800 underline mt-2 inline-block">
                  Open in new tab →
                </a>
              </div>
            </div>`;
          }
          
          return `<div class="${containerClass}">
            <iframe${beforeSrc}
              src="${src}"${afterSrc}
              class="${iframeClass}"
              style="height: ${height};"
              loading="lazy"
              allowfullscreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
              onerror="this.parentElement.innerHTML='<div class=\\"flex items-center gap-2 p-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg\\"><svg class=\\"w-4 h-4\\" fill=\\"none\\" stroke=\\"currentColor\\" viewBox=\\"0 0 24 24\\"><path stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" stroke-width=\\"2\\" d=\\"M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\\"></path></svg>Failed to load embedded content</div>'"
            ></iframe>
          </div>`;
        }
      );
    } else {
      // Replace iframes with informative placeholders
      let iframeCount = 0;
      content = content.replace(
        /<iframe[^>]*?src=["']([^"']*?)["'][^>]*?>/gi,
        ( src) => {
          iframeCount++;
          
          // Determine content type for better placeholder
          const isVideo = src.includes('youtube') || src.includes('vimeo') || src.includes('video');
          const isMap = src.includes('maps.google') || src.includes('openstreetmap') || src.includes('mapbox');
          const isForm = src.includes('forms.') || src.includes('typeform') || src.includes('survey');
          const isSocial = src.includes('twitter') || src.includes('facebook') || src.includes('instagram');
          
          let contentType = 'Embedded content';
          let icon = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>`;
          
          if (isVideo) {
            contentType = 'Video';
            icon = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"></path>`;
          } else if (isMap) {
            contentType = 'Map';
            icon = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>`;
          } else if (isForm) {
            contentType = 'Form';
            icon = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>`;
          } else if (isSocial) {
            contentType = 'Social media post';
            icon = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>`;
          }
          
          return `<div class="flex items-center gap-3 p-4 my-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg min-h-[200px]">
            <div class="flex-shrink-0 p-3 bg-blue-200 rounded-lg">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${icon}
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-blue-800">${contentType} blocked</p>
              <p class="text-xs text-blue-600 mt-1">${new URL(src).hostname}</p>
              <div class="mt-3 space-y-2">
                <button 
                  onclick="document.querySelector('[data-toggle-images]').click()" 
                  class="text-xs text-blue-600 hover:text-blue-800 underline block"
                >
                  Click "Show Images" to load embedded content
                </button>
                <a href="${src}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:text-blue-800 underline block">
                  Open in new tab →
                </a>
              </div>
            </div>
          </div>`;
        }
      );
    }

    // Handle images (after iframes to avoid conflicts)
    if (loadImages) {
      // Enable images with proper styling and error handling
      content = content.replace(
        /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
        ( beforeSrc, src, afterSrc) => {
          // Check if it's a data URL or external URL
          const isDataUrl = src.startsWith('data:');
          const isBlockedSrc = src.includes('tracking') || src.includes('pixel') || src.includes('beacon');
          
          if (isBlockedSrc && !isDataUrl) {
            return `<div class="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-lg my-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636 5.636 18.364"></path>
              </svg>
              Blocked tracking image
            </div>`;
          }

          return `<div class="my-4 max-w-full">
            <img${beforeSrc}
              src="${src}"${afterSrc}
              class="max-w-full h-auto rounded-lg shadow-sm border border-gray-200"
              style="max-height: 400px; width: auto;"
              loading="lazy"
              onerror="this.parentElement.innerHTML='<div class=\\"inline-flex items-center gap-2 px-3 py-2 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg\\"><svg class=\\"w-4 h-4\\" fill=\\"none\\" stroke=\\"currentColor\\" viewBox=\\"0 0 24 24\\"><path stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" stroke-width=\\"2\\" d=\\"M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\\"></path></svg>Failed to load image</div>'"
            />
          </div>`;
        }
      );
    } else {
      // Replace images with placeholders that maintain consistent spacing
      let imageCount = 0;
      content = content.replace(
        /<img[^>]*?>/gi,
        (match) => {
          imageCount++;
          // Extract alt text if available
          const altMatch = match.match(/alt=["']([^"']*?)["']/i);
          const altText = altMatch ? altMatch[1] : `Image ${imageCount}`;
          
          return `<div class="flex items-center gap-3 p-4 my-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg min-h-[120px]">
            <div class="flex-shrink-0 p-3 bg-gray-200 rounded-lg">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-700">Image blocked for privacy</p>
              <p class="text-xs text-gray-500 mt-1">${altText}</p>
              <button 
                onclick="document.querySelector('[data-toggle-images]').click()" 
                class="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Click "Show Images" to load
              </button>
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
    <div className="flex flex-col flex-1 h-full bg-white">
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
                data-toggle-images
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
            className="leading-relaxed prose text-gray-800 prose-blue max-w-none"
            style={{ 
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap' // This preserves whitespace and line breaks
            }}
            dangerouslySetInnerHTML={{ 
              __html: processedContent || email.snippet || 'No content available' 
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