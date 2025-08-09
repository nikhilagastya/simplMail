import React, { useEffect, useState } from 'react';
import { LogIn, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase'; 

interface GoogleAuthProps {
  onAuthSuccess: (accessToken: string,providerToken:string, refreshToken: string | undefined, email: string) => void;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      
      if (error) {
        console.error('Error fetching session:', error);
        setError('Authentication failed. Please try again.');
        return;
      }

      if (session) {
        const {error}=await supabase.from('user_profiles').upsert({
          
          id: session.user.id,
          email: session.user.email,
          google_refresh_token: session.provider_refresh_token || null,
        })
        if(error){
          console.error('Error inserting user profile:', error);
        }
        const accessToken = session.access_token;
        const refreshToken = session.refresh_token;
        const email = session.user.email!;
        const providerToken = session.provider_token!; 
        onAuthSuccess(accessToken,providerToken, refreshToken, email);
      
      }
    };

    handleOAuthRedirect();
  }, [onAuthSuccess]);

  const handleGoogleAuth = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes:'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
          queryParams: { access_type: "offline", prompt: "consent" }
        },
      });

      if (error) {
        console.error('Supabase Auth error:', error);
        setError('Failed to authenticate. Please try again.');
        setIsLoading(false);
      }

     
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen text-white bg-black">
      <div className="w-full max-w-md mx-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-white rounded-full">
            <Mail className="w-8 h-8 text-black" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Gmail AI Assistant</h1>
          <p className="text-gray-400">
            Connect your Gmail account to get AI-powered email insights and smart reminders
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-200 bg-red-900 border border-red-700 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="flex items-center justify-center w-full gap-2 px-4 py-3 font-semibold text-black transition-colors duration-200 bg-white rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 rounded-full border-t-black animate-spin" />
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          {isLoading ? 'Connecting...' : 'Connect with Google'}
        </button>

        <div className="mt-6 text-xs text-center text-gray-500">
          <p>We'll only access your Gmail data to provide AI summaries and reminders.</p>
          <p className="mt-1">Your data is never stored permanently.</p>
        </div>
      </div>
    </div>
  );
};
