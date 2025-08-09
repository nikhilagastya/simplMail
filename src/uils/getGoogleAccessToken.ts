// utils/getGoogleAccessToken.ts
import { supabase } from "../lib/supabase";

export async function getGoogleAccessToken(): Promise<string | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
  
    if (error) {
      console.error("Error getting Supabase session:", error);
      return null;
    }
  
    if (!session) {
      console.warn("No active session found");
      return null;
    }
  
    const { data: userProfile, error: userError } = await supabase
      .from("user_profiles")
      .select("google_refresh_token")
      .eq("id", session.user.id)
      .single();
  
    if (userError) {
      console.error("Error fetching user profile:", userError);
      return null;
    }
  
    const refreshToken = userProfile?.google_refresh_token;
    if (!refreshToken) {
      console.warn("No Google refresh token found for user");
      return null;
    }
  
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
      console.log(res)
      if (!res.ok) {
        console.error("Failed to fetch Google access token:", await res.text());
        supabase.auth.signOut();
        return null;
      }
  
      const tokenData = await res.json();
      console.log("Google token response:", tokenData);
  
      return tokenData.access_token ?? null;
    } catch (err) {
      console.error("Error refreshing Google access token:", err);
      supabase.auth.signOut();
      return null;
    }
  }
  