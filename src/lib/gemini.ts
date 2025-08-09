export interface EmailSummary {
  summary: string;
  actionItems: string[];
  priority: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateEmailSummary(emailContent: string, subject: string): Promise<EmailSummary> {
    const prompt = `
      Analyze this email and provide a structured summary:
      
      Subject: ${subject}
      Content: ${emailContent}
      
      Please provide:
      1. A concise 2-3 sentence summary
      2. List of action items (if any)
      3. Priority level (1-5, where 5 is most urgent)
      4. Sentiment (positive, neutral, negative)
      
      Format your response as JSON with keys: summary, actionItems, priority, sentiment
    `;

    try {
      // Check if API key is available and valid
      if (!this.apiKey || this.apiKey === 'demo-key') {
        console.warn('Gemini API key not configured, using fallback summary');
        return this.getFallbackSummary(emailContent, subject);
      }

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      });

      if (!response.ok) {
        console.warn(`Gemini API error: ${response.status} ${response.statusText}`);
        return this.getFallbackSummary(emailContent, subject);
      }

      const data = await response.json();
      const generatedText = data.candidates[0]?.content?.parts[0]?.text;
      
      if (!generatedText) {
        throw new Error('No response from Gemini API');
      }

      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        summary: parsed.summary || 'No summary available',
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        priority: Math.min(Math.max(parsed.priority || 3, 1), 5),
        sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) 
          ? parsed.sentiment : 'neutral'
      };
    } catch (error) {
      console.error('Error generating email summary:', error);
      return this.getFallbackSummary(emailContent, subject);
    }
  }

  private getFallbackSummary(emailContent: string, subject: string): EmailSummary {
    // Generate a simple fallback summary based on content analysis
    const wordCount = emailContent.split(' ').length;
    const hasUrgentKeywords = /urgent|asap|deadline|important|critical/i.test(emailContent + ' ' + subject);
    const hasActionKeywords = /please|need|should|must|action|review|complete/i.test(emailContent);
    
    let priority = 3;
    if (hasUrgentKeywords) priority = 5;
    else if (hasActionKeywords) priority = 4;
    
    const actionItems: string[] = [];
    if (hasActionKeywords) {
      actionItems.push('Review email content');
      if (/meeting|schedule/i.test(emailContent)) actionItems.push('Check calendar');
      if (/document|file|attachment/i.test(emailContent)) actionItems.push('Review attachments');
    }
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (/thank|great|excellent|good|pleased/i.test(emailContent)) sentiment = 'positive';
    else if (/problem|issue|concern|urgent|error/i.test(emailContent)) sentiment = 'negative';
    
    return {
      summary: `Email about "${subject}" (${wordCount} words). ${hasUrgentKeywords ? 'Contains urgent keywords.' : ''} ${hasActionKeywords ? 'May require action.' : ''}`.trim(),
      actionItems,
      priority,
      sentiment
    };
  }
}