# 🚀 SimplMail

An intelligent email management application that transforms your Gmail experience with AI-powered insights, smart summaries, and productivity features.


## ✨ Features

### 🤖 **AI-Powered Intelligence**
- **Smart Email Summaries**: Get instant AI-generated summaries of your emails
- **Priority Scoring**: Automatic priority classification (P1-P5) based on content urgency
- **Action Item Extraction**: Automatically identifies and lists actionable tasks from emails
- **Context-Aware Analysis**: Understands email context for better insights

### 📧 **Enhanced Email Experience**
- **Gmail-like Interface**: Familiar and intuitive design
- **Smart Link Handling**: Safely handles long tracking URLs and complex links


### ⚡ **Productivity Features**
- **Smart Reminders**: Set intelligent follow-up reminders (1h, 4h, 1d, 3d, 1w)
- **Keyboard Shortcuts**: Quick actions with `S` (summary) and `R` (reminder)
- **Attachment Preview**: View attachment details with file size and type


### 🎯 **Developer-Friendly**
- **Gmail API Integration**: Seamless connection to Gmail with OAuth2
- **Type-Safe**: Full TypeScript support with proper interfaces
- **Component-Based**: Modular React components for easy customization
- **Extensible**: Easy to add new AI features and integrations

## 🛠️ Tech Stack

- **Frontend**: Vite, TypeScript, Tailwind CSS
- **Database**: Supabase
- **Icons**: Lucide React
- **Email API**: Gmail API
- **AI Integration**: Ready for Gemini
- **Authentication**: Google OAuth2
- **Styling**: Responsive design with mobile-first approach

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Console account
- Gmail API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nikhilagastya/simplMail
   cd simplMail
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your credentials:
   ```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google APIs
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🔧 Gmail API Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API

### 2. Configure OAuth2

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Set application type to **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### 3. Required Scopes

The application requests these Gmail API scopes:
- `https://www.googleapis.com/auth/gmail.readonly`


## 📱 Usage

### Basic Operations

1. **Sign in with Google** - Authenticate with your Gmail account
2. **Browse Emails** - Navigate through your inbox with arrow keys
3. **Generate Summary** - Press `S` or click the sparkle button for AI summary
4. **Set Reminders** - Press `R` or click the clock button to set follow-up reminders
5. **View Attachments** - See attachment details and download links

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑↓` | Navigate between emails |
| `S` | Generate AI summary |
| `R` | Set reminder |
| `Enter` | Open selected email |

### AI Summary Features

- **Priority Levels**: P1 (Low) to P5 (Critical)
- **Action Items**: Automatically extracted tasks
- **Smart Analysis**: Context-aware content understanding

## 🎨 Components

### Core Components

- **`EmailViewer`**: Main email display component with AI features
- **`HTMLContentViewer`**: Universal HTML content renderer
- **`EmailList`**: Email list with navigation and search
- **`AIPanel`**: Summary and action items display



## 🤖 AI Integration

### Adding Custom AI Providers

The application is designed to work with multiple AI providers:

```typescript
interface AIProvider {
  generateSummary(email: GmailEmail): Promise<EmailSummary>;
  extractActionItems(email: GmailEmail): Promise<string[]>;
  calculatePriority(email: GmailEmail): Promise<number>;
}
```


## 🔒 Security & Privacy

- **OAuth2 Authentication**: Secure Google authentication
- **Limited Scope**: Only requests necessary Gmail permissions
- **Local Processing**: Email content processed securely
- **No Data Storage**: Emails are not stored on our servers
- **Safe Link Handling**: All external links open safely in new tabs

## 📊 Performance

- **Lazy Loading**: Emails loaded on demand
- **Optimized Rendering**: Efficient HTML content display
- **Responsive Images**: Automatic image optimization
- **Fast AI Processing**: Optimized prompts for quick responses



## 📦 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Common Issues

**Gmail API Authentication Errors**
```bash
Error: invalid_grant
```
- Check if your system clock is correct
- Verify OAuth2 credentials in Google Cloud Console

**AI Summary Not Working**
- Verify your AI API key in environment variables
- Check API rate limits and usage

**Email Content Not Displaying**
- Clear browser cache and cookies
- Check Gmail API permissions


## 🎯 Roadmap

### v2.0 Features
- [ ] Multiple account support
- [ ] Email content dsiplay fix
- [ ] Email templates and automation
- [ ] Advanced search and filtering

### v2.1 Features
- [ ] Calendar integration
- [ ] Meeting scheduling from emails
- [ ] Advanced analytics dashboard
- [ ] Email insights and patterns
- [ ] Custom reminder types

---

**Built with ❤️ for productivity enthusiasts**
