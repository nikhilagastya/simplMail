import  { useState, useEffect } from 'react';
import { GoogleAuth } from './components/GoogleAuth';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailViewer } from './components/EmailViewer';
import { RemindersList } from './components/RemindersList';
import { GmailService, type GmailMessage, type PaginatedEmailResponse } from './lib/gmail';
import { GeminiService, type EmailSummary } from './lib/gemini';
import { supabase } from './lib/supabase';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [providerToken, setproviderToken] = useState<string | null>(null);
    const [emails, setEmails] = useState<GmailMessage[]>([]);
    const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);
    const [activeView, setActiveView] = useState<'inbox' | 'reminders'>('inbox');
    const [reminders, setReminders] = useState<any[]>([]);
    const [, setUser] = useState<any>(null);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [hasMoreEmails, setHasMoreEmails] = useState(false);
    const [isLoadingEmails, setIsLoadingEmails] = useState(false);
    const [totalEmailsEstimate, setTotalEmailsEstimate] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);

    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY ;
    const geminiService = new GeminiService(geminiApiKey);
    const emailsPerPage = 30;

    // Load emails and reminders
    useEffect(() => {
        if (isAuthenticated && accessToken && providerToken) {
            fetchEmails(providerToken);
            loadReminders();
        }
    }, [isAuthenticated, accessToken]);

    // Keyboard navigation
    useKeyboardNavigation({
        onArrowUp: () => {
            if (activeView === 'inbox') {
                setSelectedEmailIndex(prev => Math.max(0, prev - 1));
            }
        },
        onArrowDown: () => {
            if (activeView === 'inbox') {
                setSelectedEmailIndex(prev => Math.min(emails.length - 1, prev + 1));
            }
        },
        onSummary: () => {
            if (activeView === 'inbox' && emails[selectedEmailIndex]) {
                handleGenerateSummary(emails[selectedEmailIndex]);
            }
        },
        onReminder: () => {
            if (activeView === 'inbox' && emails[selectedEmailIndex]) {
                
            }
        },
        isEnabled: isAuthenticated
    });

    const handleAuthSuccess = (token: string, providerToken: string) => {
        setproviderToken(providerToken);
        setAccessToken(token);
        setIsAuthenticated(true);
        createUserProfile(providerToken);
    };

    const createUserProfile = async (token: string) => {
        try {
            const gmailService = new GmailService(token);
            const user = await gmailService.getUserProfile()
            setUser(user);
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    };

    const fetchEmails = async (token: string, pageToken?: string, append = false) => {
        try {
            setIsLoadingEmails(true);
            const gmailService = new GmailService(token);
            const response: PaginatedEmailResponse = await gmailService.getMessages(emailsPerPage, pageToken);
            
            if (append) {
                setEmails(prevEmails => [...prevEmails, ...response.messages]);
            } else {
                setEmails(response.messages);
                setCurrentPage(1);
                setSelectedEmailIndex(0);
            }
            
            setNextPageToken(response.nextPageToken || null);
            setHasMoreEmails(response.hasMore);
            setTotalEmailsEstimate(response.totalEstimate || 0);
            
            console.log('Emails loaded:', response.messages.length, 'Has more:', response.hasMore);
        } catch (error) {
            console.error('Error fetching Gmail emails:', error);
        } finally {
            setIsLoadingEmails(false);
        }
    };

    const loadMoreEmails = async () => {
        if (!nextPageToken || !providerToken || isLoadingEmails) {
            return;
        }
        
        setCurrentPage(prev => prev + 1);
        await fetchEmails(providerToken, nextPageToken, true);
    };

    const refreshEmails = async () => {
        if (!providerToken) return;
        
        setNextPageToken(null);
        setHasMoreEmails(false);
        setCurrentPage(1);
        await fetchEmails(providerToken);
    };

    const loadReminders = async () => {
        try {
            const session=await supabase.auth.getSession()
            const userId= session.data.session?.user.id;
            const { data: reminders, error } = await supabase
                .from('email_reminders')
                .select('*')
                .eq('user_id', userId);
                
            if (error) {
                throw error;
            }
            console.log(reminders)
            setReminders(reminders || []);
        } catch (error) {
            console.error('Error loading reminders:', error);
            setReminders([]);
        }
    };

    const handleGenerateSummary = async (email: GmailMessage): Promise<EmailSummary> => {
        try {
            return await geminiService.generateEmailSummary(email.body, email.subject);
        } catch (error) {
            console.error('Error generating summary:', error);
            throw error;
        }
    };

    const handleCreateReminder = async (email: any, remindAt: Date) => {
        try {
            const session=await supabase.auth.getSession()
            const userId= session.data.session?.user.id;
            const newReminder = {
                user_id: userId,
                email_id: email.id,
                email_subject: email.subject,
                email_sender: email.from.split('<')[0].trim(),
                summary: null,
                action_items: [],
                remind_at: remindAt.toISOString(),
                priority_level: 3,
                is_completed: false
            };
            
            const { data, error } = await supabase
                .from('email_reminders')
                .insert([newReminder])
                .select()
                .single();

            if (error) {
                throw error;
            }

            setReminders(prev => [...prev, data]);
            console.log('Reminder created successfully:', data);
        } catch (error) {
            console.error('Error creating reminder:', error);
        }
    };

    const handleCompleteReminder = async (reminderId: string) => {
        try {
             await supabase
                .from('email_reminders')
                .update({ is_completed: true })
                .eq('id', reminderId)
                .select()
                .single();
                
            setReminders(prev =>
                prev.map(r => (r.id === reminderId ? { ...r, is_completed: true } : r))
            );
        } catch (error) {
            console.error('Error completing reminder:', error);
        }
    };

    const handleViewEmail = (emailId: string) => {
        const emailIndex = emails.findIndex(e => e.id === emailId);
        if (emailIndex !== -1) {
            setSelectedEmailIndex(emailIndex);
            setActiveView('inbox');
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        
        setIsAuthenticated(false);
        setAccessToken(null);
        setEmails([]);
        setReminders([]);
        setUser(null);
        setSelectedEmailIndex(0);
        setActiveView('inbox');
        setNextPageToken(null);
        setHasMoreEmails(false);
        setCurrentPage(1);
        setTotalEmailsEstimate(0);
    };

    if (!isAuthenticated) {
        return <GoogleAuth onAuthSuccess={handleAuthSuccess} />;
    }

    return (
        <div className="flex h-screen bg-white">
            <Sidebar
                activeView={activeView}
                onViewChange={setActiveView}
                onSignOut={handleSignOut}
                reminderCount={reminders.filter(r => !r.is_completed).length}
            />

            {activeView === 'inbox' ? (
                <>
                    <EmailList
                        emails={emails}
                        selectedIndex={selectedEmailIndex}
                        onSelectEmail={setSelectedEmailIndex}
                        reminders={reminders}
                        // Pagination props
                        hasMoreEmails={hasMoreEmails}
                        isLoadingEmails={isLoadingEmails}
                        onLoadMore={loadMoreEmails}
                        onRefresh={refreshEmails}
                        currentPage={currentPage}
                        totalEmailsEstimate={totalEmailsEstimate}
                        emailsPerPage={emailsPerPage}
                    />
                    <EmailViewer
                        email={emails[selectedEmailIndex]}
                        onGenerateSummary={handleGenerateSummary}
                        onCreateReminder={handleCreateReminder}
                    />
                </>
            ) : (
                <RemindersList
                    reminders={reminders}
                    onCompleteReminder={handleCompleteReminder}
                    onViewEmail={handleViewEmail}
                />
            )}
        </div>
    );
}

export default App;