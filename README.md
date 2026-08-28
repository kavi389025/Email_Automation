# Intelligent Email Assistant (MailSense AI)

MailSense AI is a modern, full-stack, AI-powered email management and webmail client built with **Next.js (Pages Router)**, **Express**, **MongoDB (with automatic in-memory zero-config fallback)**, and **Google APIs (Gmail OAuth 2.0)**. It enables users to browse, search, and manage their email inbox while leveraging a multi-tier AI engine (OpenRouter → Google Gemini → Deterministic Rule Engine) to generate executive email summaries, extract action items and deadlines, and draft context-aware replies with customizable tone.

---

## 🌟 Key Features

1. **Secure Google OAuth 2.0 Integration**:
   - Zero password storage. Uses OAuth 2.0 consent for Gmail access (`readonly`, `send`, `modify` scopes).
   - OAuth tokens (access & refresh tokens) are encrypted at rest with **AES-256-GCM** using an application master key.
   - Missing or expired tokens surface clear `GMAIL_NOT_CONNECTED` or `AUTH_EXPIRED` errors.
   - Includes an **Instant Evaluation Sandbox Mode** that seeds realistic sample emails for local zero-configuration testing.

2. **AI-Powered Executive Summaries**:
   - Analyzes single emails or complete multi-message threads.
   - Produces 2-3 sentence executive summaries, key highlights, sender intent classification, and urgency indicators.
   - Automatically extracts actionable tasks, assignees, and deadlines.

3. **Context-Aware AI Reply Generation (Human-in-the-Loop)**:
   - Drafts contextual responses tailored to chosen tones: **Professional**, **Friendly**, **Formal**, or **Concise**.
   - Supports optional custom user guidance.
   - AI drafts are rendered in an editable text area for review and customization before sending—the AI never sends emails without explicit confirmation.

4. **Multi-Tier AI Fallback Engine**:
   - Primary: **OpenRouter API** (`OPENROUTER_API_KEY`)
   - Secondary: **Google Gemini Generative AI SDK** (`GEMINI_API_KEY`)
   - Tertiary: **Extractive Deterministic Rule Engine** (guarantees the app is 100% functional even offline or without live API keys).

5. **Complete Inbox Triage & Audit History**:
   - Smart categorization: `Work`, `Personal`, `Updates`, `Promotions`.
   - Full thread view with chronological message grouping.
   - Real-time in-app notifications drawer.
   - Detailed audit trail of user actions and AI activity logs.

---

## 🏗️ Architecture & Project Structure

```
AI automation/
├── client/                     # Next.js (Pages Router) + React 19 + Tailwind CSS + Zustand
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppShell/       # Header, Sidebar, Notifications Drawer, User Profile
│   │   │   ├── InboxList/      # Filterable email list with category pills & skeleton loaders
│   │   │   ├── EmailThreadView/# Chronological thread view with sender grouping
│   │   │   ├── ComposeModal/   # Modal with To/Cc/Bcc, editable body, and AI Assist
│   │   │   ├── AISummaryPanel/ # Summary card (key takeaways, sender intent, deadlines)
│   │   │   ├── AIReplyPanel/   # Tone selection & editable draft review panel
│   │   │   └── ProtectedRoute/ # Client auth guard
│   │   ├── pages/
│   │   │   ├── _app.js         # Global styles, AppShell wrapper, Auth initialization
│   │   │   ├── index.js        # Landing page with live interactive preview
│   │   │   ├── login.js        # Auth login with demo account filler
│   │   │   ├── register.js     # User registration
│   │   │   ├── dashboard.js    # Inbox analytics, AI stats, quick actions
│   │   │   ├── inbox/
│   │   │   │   ├── index.js    # Full inbox view with category filters & search
│   │   │   │   └── [id].js     # Single email & thread view with AI Summary and Reply
│   │   │   ├── accounts.js     # Gmail OAuth connection manager & sandbox toggle
│   │   │   ├── activity.js     # User audit trail & AI action history log
│   │   │   └── settings.js     # System diagnostics & AI provider health checks
│   │   ├── store/
│   │   │   ├── authStore.js    # Zustand store with localStorage persistence
│   │   │   └── emailStore.js   # Selected account, active category, compose state
│   │   ├── services/
│   │   │   ├── api.js          # Centralized Axios client with JWT interceptor
│   │   │   └── auth.js         # Auth helper methods
│   │   └── styles/
│   │       └── globals.css     # Dark-themed styling and glassmorphism utilities
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/                     # Express + Mongoose + Google APIs + AI Engine + JWT Auth
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js          # Centralized environment configuration
│   │   │   ├── db.js           # Mongoose with automatic MongoMemoryServer fallback
│   │   │   └── googleOAuth.js  # Google OAuth2 client & token lifecycle
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/auth (register, login, me)
│   │   │   ├── emailAccountRoutes.js # /api/email-accounts (oauth/start, callback, sandbox)
│   │   │   ├── emailRoutes.js        # /api/emails (list, stats, thread, patch, delete, send)
│   │   │   ├── aiRoutes.js           # /api/ai (summarize, generate-reply, classify, activity)
│   │   │   ├── activityRoutes.js     # /api/activity (audit history)
│   │   │   └── notificationRoutes.js # /api/notifications (alerts)
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── authService.js        # Password hashing (bcrypt cost 12), JWT generation
│   │   │   ├── gmailService.js       # Gmail operations, token encryption & cache sync
│   │   │   ├── emailService.js       # Email search, pagination, sending & stats
│   │   │   ├── aiService.js          # Multi-tier AI fallback orchestration
│   │   │   └── activityService.js    # Audit trail & Notification persistence
│   │   ├── integrations/
│   │   │   ├── baseEmailProvider.js  # Abstract interface for email providers
│   │   │   └── gmailProvider.js      # Concrete provider with Google APIs & sandbox mode
│   │   ├── ai/
│   │   │   ├── summarizer.js         # Email/Thread summarization & deadline extraction
│   │   │   ├── replyGenerator.js     # Tone-aware draft reply generator
│   │   │   └── classifier.js         # Category classification & priority scoring
│   │   ├── models/
│   │   │   ├── User.js               # User accounts
│   │   │   ├── EmailAccount.js       # Connected Gmail accounts (encrypted tokens)
│   │   │   ├── EmailCache.js         # Synced email messages & threads
│   │   │   ├── AIActivity.js         # AI operations history
│   │   │   ├── ActivityLog.js        # User audit trail
│   │   │   └── Notification.js       # Alerts & notifications
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification
│   │   │   ├── validate.js           # express-validator handler
│   │   │   └── errorHandler.js       # Standardized error response formatter
│   │   ├── utils/
│   │   │   └── encryption.js         # AES-256-GCM token encryption/decryption
│   │   └── index.js                  # Express bootstrap, security headers, route mounting
│   ├── test_api.js                   # API verification test suite
│   ├── package.json
│   └── .env.example
├── package.json                       # Workspace root scripts
├── specs.md                           # Specification sheet (Single Source of Truth)
└── README.md
```

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **MongoDB** *(Optional)*: If no MongoDB instance is running, the server automatically starts an in-memory MongoDB instance (`mongodb-memory-server`) with zero configuration.

---

## ⚙️ Environment Configuration

### Backend Environment (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```bash
# Server Port & Environment
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Security & Authentication
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d
CREDENTIAL_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Database (Leave empty for automatic in-memory MongoDB fallback)
MONGODB_URI=

# Google OAuth 2.0 for Gmail (Optional - leave empty to use Instant Sandbox mode)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/email-accounts/oauth/callback

# AI Keys (Optional - falls back to Google Gemini, then to Deterministic engine)
OPENROUTER_API_KEY=
GEMINI_API_KEY=
```

### Frontend Environment (`client/.env.local` - Optional)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Quickstart: Running Locally

### Step 1: Install Dependencies

From the workspace root, install dependencies for both the backend and frontend:

```bash
# 1. Install server dependencies
cd server
npm install

# 2. Install client dependencies
cd ../client
npm install
```

### Step 2: Start the Application

You can run the backend and frontend simultaneously in separate terminals:

#### Terminal 1 — Start Backend Server (Port 5000):
```bash
cd server
npm start
# or for auto-reload: npm run dev
```

#### Terminal 2 — Start Frontend Client (Port 3000):
```bash
cd client
npm start
# or for dev mode: npm run dev
```

Open your browser and navigate to **`http://localhost:3000`**.

---

## 🧪 Testing and Verifying APIs

Run the automated backend test suite from the `server/` directory:

```bash
cd server
node test_api.js
```

This verifies:
- Health check endpoint
- User registration and JWT authentication
- Profile retrieval (`/api/auth/me`)
- Sandbox email account creation and demo email seeding
- Email list retrieval and category filtering
- AI summarization and deadline extraction
- Tone-aware AI reply generation
- Email sending and audit logging
- Dashboard metrics and activity logs

---

## 💡 How to Use the Application

1. **Create an Account**:
   - Go to `http://localhost:3000/register`.
   - Enter your name, email, and password.
2. **Connect an Email Account**:
   - **Sandbox Mode (Instant Evaluation)**: Click **"Add Sandbox Demo Inbox"** on the Accounts page (`/accounts`) to instantly populate realistic sample emails (Cloud migration review, Enterprise renewal discount, Security alert, Developer tool promotion).
   - **Real Gmail (OAuth)**: Provide your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `server/.env` and click **"Connect Gmail (OAuth)"** to authenticate via Google's consent screen.
3. **Explore the Inbox (`/inbox`)**:
   - Filter by AI categories (`Work`, `Personal`, `Updates`, `Promotions`).
   - Search across subject, sender, and email body.
   - Star, archive, mark read/unread, or move emails to trash.
4. **AI Email Summaries (`/inbox/[id]`)**:
   - Click on any email to open the full thread.
   - View the AI Executive Summary banner displaying key highlights, urgency score, and extracted deadlines.
5. **AI Tone-Aware Reply Drafting**:
   - Select a response tone: **Professional**, **Friendly**, **Formal**, or **Concise**.
   - (Optional) Provide custom guidance (e.g. *"Confirm sign-off on Thursday's test"*).
   - Click **"Draft Reply"** to generate the response.
   - Review and edit the draft directly in the editable text area.
   - Click **"Send Reply"** to dispatch the email.
6. **Dashboard & Audit Trail**:
   - Check `/dashboard` for email volume breakdowns and triage charts.
   - Check `/activity` to review every email operation and AI generation event.

---

## 📡 API Reference

### Health & Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | System status, AI keys & database status | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | No |
| `GET` | `/api/auth/me` | Fetch user profile & connected accounts | Yes |

### Email Accounts & OAuth
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/email-accounts` | List connected email accounts | Yes |
| `GET` | `/api/email-accounts/oauth/start` | Generate Google OAuth consent URL | Yes |
| `GET` | `/api/email-accounts/oauth/callback` | OAuth redirect callback handler | Direct / OAuth |
| `POST` | `/api/email-accounts/sandbox` | Initialize sandbox demo inbox | Yes |
| `POST` | `/api/email-accounts/:id/sync` | Trigger manual sync with Gmail | Yes |
| `DELETE` | `/api/email-accounts/:id` | Disconnect an email account | Yes |

### Emails & Management
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/emails` | List emails (supports `folder`, `category`, `search`, `page`, `limit`) | Yes |
| `GET` | `/api/emails/stats` | Dashboard metrics & category counts | Yes |
| `GET` | `/api/emails/:id` | Fetch single email | Yes |
| `GET` | `/api/emails/thread/:threadId` | Fetch ordered thread messages | Yes |
| `PATCH` | `/api/emails/:id` | Update flags (`isRead`, `isStarred`, `isArchived`) | Yes |
| `DELETE` | `/api/emails/:id` | Move email to trash | Yes |
| `POST` | `/api/emails/send` | Send new email, reply, or forward | Yes |

### AI Operations
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/ai/summarize` | Summarize email/thread & extract deadlines | Yes |
| `POST` | `/api/ai/generate-reply` | Generate editable draft with tone selection | Yes |
| `POST` | `/api/ai/classify` | Classify email category & priority | Yes |
| `GET` | `/api/ai/activity` | List AI action history | Yes |

### Activity & Notifications
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/activity` | List user audit trail | Yes |
| `GET` | `/api/notifications` | List user notifications | Yes |
| `PATCH` | `/api/notifications/mark-all-read` | Mark all notifications as read | Yes |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read | Yes |

---

## 🔒 Security & Privacy

- **No Email Passwords**: The application uses Google OAuth 2.0 tokens exclusively and never asks for your email password.
- **AES-256-GCM Token Encryption**: OAuth tokens are encrypted with an application master key before writing to the database.
- **Rate Limiting**: Auth and OAuth endpoints are protected against brute-force attacks via `express-rate-limit`.
- **Security Headers**: Standard HTTP security headers applied via `helmet`.
- **Zero Accidental Sending**: AI-generated reply drafts are always presented in an editable textarea for explicit user review and confirmation before sending.

---

## 📄 License

MIT License. Designed and built according to [specs.md](file:///e:/AI%20automation/specs.md).
