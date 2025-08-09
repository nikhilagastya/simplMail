import { getGoogleAccessToken } from "../uils/getGoogleAccessToken";

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
  isRead: boolean;  
}

export interface PaginatedEmailResponse {
  messages: GmailMessage[];
  nextPageToken?: string;
  hasMore: boolean;
  totalEstimate?: number;
}

export class GmailService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async refreshAccessToken() {
    const token = await getGoogleAccessToken();
    if (!token) throw new Error("Unable to refresh Google access token");
    this.accessToken = token;
    console.log(token, 'new access token set');
  }

  private async fetchWithAutoRefresh(url: string, options: RequestInit, retry = true): Promise<Response> {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (res.status === 401 && retry) {
      console.warn("Google API 401 — refreshing token...");
      await this.refreshAccessToken();
      console.log('hii')
      return this.fetchWithAutoRefresh(url, options, false);
    }

    return res;
  }

  async getMessages(maxResults = 30, pageToken?: string): Promise<PaginatedEmailResponse> {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      q: 'in:inbox -in:spam -in:trash'
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const response = await this.fetchWithAutoRefresh(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
      {}
    );

    const data = await response.json();

    if (!data.messages) {
      return {
        messages: [],
        hasMore: false,
        totalEstimate: data.resultSizeEstimate || 0
      };
    }

    const messages = await Promise.all(
      data.messages.map(async (msg: any) => {
        const full = await this.getMessage(msg.id);
        return full;
      })
    );

    return {
      messages,
      nextPageToken: data.nextPageToken,
      hasMore: !!data.nextPageToken,
      totalEstimate: data.resultSizeEstimate
    };
  }

  async getMoreMessages(pageToken: string, maxResults = 30): Promise<PaginatedEmailResponse> {
    return this.getMessages(maxResults, pageToken);
  }

  async getMessage(messageId: string): Promise<GmailMessage> {
    const response = await this.fetchWithAutoRefresh(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {}
    );
    const data = await response.json();
    return this.parseMessage(data);
  }

  async getUserProfile(): Promise<{ id: string; email: string; name: string }> {
    const response = await this.fetchWithAutoRefresh(
      `https://www.googleapis.com/oauth2/v2/userinfo`,
      {}
    );

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name || data.email,
    };
  }

  private parseMessage(message: any): GmailMessage {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    let body = '';
    if (message.payload?.parts) {
      body = this.extractTextFromParts(message.payload.parts);
    } else if (message.payload?.body?.data) {
      body = this.decode(message.payload.body.data);
    }

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      date: new Date(getHeader('Date')).toISOString(),
      snippet: message.snippet || '',
      body,
      isRead: !message.labelIds?.includes('UNREAD'),
    };
  }

  private extractTextFromParts(parts: any[]): string {
    let text = '';
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += this.decode(part.body.data);
      } else if (part.parts) {
        text += this.extractTextFromParts(part.parts);
      }
    }
    return text;
  }

  private decode(base64: string): string {
    return decodeURIComponent(escape(atob(base64.replace(/-/g, '+').replace(/_/g, '/'))));
  }
}
