import React, { useEffect, useRef } from 'react';
import { RefreshCw, Clock, Loader2 } from 'lucide-react';

interface EmailListProps {
  emails: any[];
  selectedIndex: number;
  onSelectEmail: (index: number) => void;
  reminders?: any[];
  // Pagination props
  hasMoreEmails: boolean;
  isLoadingEmails: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  currentPage: number;
  totalEmailsEstimate: number;
  emailsPerPage: number;
}



export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedIndex,
  onSelectEmail,
  reminders = [],
  hasMoreEmails,
  isLoadingEmails,
  onLoadMore,
  onRefresh,
  currentPage,
  totalEmailsEstimate,
  emailsPerPage
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreEmails && !isLoadingEmails) {
          onLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMoreEmails, isLoadingEmails, onLoadMore]);

  // Scroll to selected email
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedElement = scrollContainerRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  const isReminder = (emailId: string) => {
    return reminders.some(r => r.email_id === emailId && !r.is_completed);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const extractSenderName = (from: string) => {
    // Extract name before < or use full email if no name
    const match = from.match(/^(.*?)\s*<.*>$/) || from.match(/^(.+)$/);
    return match ? match[1].trim() : from;
  };

 


  return (
    <div className="flex flex-col h-full overflow-y-auto border-r border-gray-200 w-80 bg-gray-50">
      {/* Header with pagination info and refresh button */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
          <button
            onClick={onRefresh}
            disabled={isLoadingEmails}
            className="p-2 text-gray-500 transition-colors rounded-md hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            title="Refresh emails"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingEmails ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {totalEmailsEstimate > 0 ? (
            <div className="flex items-center justify-between">
              <span>
                {emails.length > 0 
                  ? `${emails.length.toLocaleString()} of ~${totalEmailsEstimate.toLocaleString()}`
                  : 'No emails found'
                }
              </span>
              {Math.ceil(totalEmailsEstimate / emailsPerPage) > 1 && (
                <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                  Page {currentPage}
                </span>
              )}
            </div>
          ) : (
            <span>{emails.length} messages</span>
          )}
        </div>
      </div>

      {/* Email list */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {emails.length === 0 && !isLoadingEmails ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No emails found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {emails.map((email, index) => (
              <div
                key={email.id}
                onClick={() => onSelectEmail(index)}
                className={`p-4 cursor-pointer transition-colors duration-150 ${
                  index === selectedIndex 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center flex-1 min-w-0 gap-2">
                    {isReminder(email.id) && (
                      <Clock className="flex-shrink-0 w-4 h-4 text-orange-500" />
                    )}
                    <span className={`text-sm font-medium truncate ${
                      index === selectedIndex ? 'text-white' : 'text-gray-900'
                    }`}>
                      {extractSenderName(email.from)}
                    </span>
                    {!email.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <span className={`text-xs flex-shrink-0 ml-2 ${
                    index === selectedIndex ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatDate(email.date)}
                  </span>
                </div>
                
                <h3 className={`text-sm font-medium mb-1 truncate ${
                  index === selectedIndex ? 'text-white' : 'text-gray-900'
                }`}>
                  {email.subject}
                </h3>
                
                <p className={`text-sm line-clamp-2 ${
                  index === selectedIndex ? 'text-blue-100' : 'text-gray-600'
                }`}>
                  {email.snippet || email.body?.replace(/<[^>]*>/g, '')?.substring(0, 120) + '...' || 'No preview available'}
                </p>
              </div>
            ))}
            
            {/* Load more trigger and loading indicator */}
            {hasMoreEmails && (
              <div ref={loadMoreRef} className="p-4 text-center">
                {isLoadingEmails ? (
                  <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading more emails...</span>
                  </div>
                ) : (
                  <button
                    onClick={onLoadMore}
                    className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
                  >
                    Load more emails
                  </button>
                )}
              </div>
            )}
            
            {!hasMoreEmails && emails.length > 0 && (
              <div className="p-4 text-sm text-center text-gray-500">
                All emails loaded ({emails.length.toLocaleString()} total)
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Loading overlay for initial load */}
      {isLoadingEmails && emails.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-gray-700">Loading emails...</span>
          </div>
        </div>
      )}
    </div>
  );
};