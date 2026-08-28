# 🚀 Deployment Guide: Render (Backend) & Vercel (Frontend)

This guide walks you through deploying **MailSense AI** to production using:
- **GitHub** (Version Control)
- **Render** (Express + MongoDB Backend API)
- **Vercel** (Next.js Frontend Web App)
- **Google Cloud Console** (Production OAuth Configuration)

---

## 📑 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Push Code to GitHub](#step-1-push-code-to-github)
3. [Step 2: Deploy Backend to Render](#step-2-deploy-backend-to-render)
4. [Step 3: Deploy Frontend to Vercel](#step-3-deploy-frontend-to-vercel)
5. [Step 4: Connect Production URLs & Google OAuth](#step-4-connect-production-urls--google-oauth)
6. [Step 5: Verification & Testing Checklist](#step-5-verification--testing-checklist)

---

## 1. Prerequisites
- A **[GitHub](https://github.com/)** account.
- A **[Render](https://render.com/)** account.
- A **[Vercel](https://vercel.com/)** account.
- Your existing MongoDB Atlas connection string and API keys.

---

## Step 1: Push Code to GitHub

### 1.1 Verify `.gitignore`
Make sure `.gitignore` exists at the root of the project to ensure sensitive files like `.env` and `node_modules` are **never** committed to GitHub. *(Already created for you).*

### 1.2 Initialize Git and Push to GitHub

Open your terminal in the root project folder (`e:\AI automation`) and run:

```bash
# 1. Initialize git repository
git init

# 2. Add all files (respecting .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: complete MailSense AI full-stack application"

# 4. Set main branch
git branch -M main

# 5. Link to your new GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# 6. Push code to GitHub
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

1. Log in to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** → **Web Service**.
3. Select **"Build and deploy from a Git repository"** and connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `mailsense-ai-backend` (or your preferred name)
   - **Region**: Choose the region closest to you or your MongoDB Atlas cluster (e.g., *Singapore*, *Frankfurt*, *Oregon*)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Scroll down to **Environment Variables** and add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment |
| `PORT` | `10000` | Render standard port |
| `CLIENT_URL` | `http://localhost:3000` | *(Temporary — will update in Step 4 with Vercel URL)* |
| `JWT_SECRET` | `super_secret_jwt_key_mailsense_ai_2026_change_in_prod` | Your secure JWT secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `CREDENTIAL_ENCRYPTION_KEY` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | 32-byte AES encryption key |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `GOOGLE_CLIENT_ID` | `646801884619-...apps.googleusercontent.com` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | `https://<YOUR-RENDER-BACKEND-NAME>.onrender.com/api/email-accounts/oauth/callback` | Production OAuth Callback URL |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | OpenRouter API Key |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API Key |

6. Click **Deploy Web Service**.
7. Once deployed, copy your Render Web Service URL:
   `https://mailsense-ai-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

1. Log in to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Click **"Add New..."** → **"Project"**.
3. Import your GitHub repository.
4. In the **Configure Project** screen:
   - **Project Name**: `mailsense-ai`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select **`client`**
5. Expand the **Environment Variables** section and add:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://<YOUR-RENDER-BACKEND-NAME>.onrender.com/api` |

*(Example: `https://mailsense-ai-backend.onrender.com/api`)*

6. Click **Deploy**.
7. Once deployment completes, copy your Vercel live URL:
   `https://mailsense-ai.vercel.app`

---

## Step 4: Connect Production URLs & Google OAuth

Now that both the backend and frontend are live, link them together:

### 4.1 Update Backend Environment Variables on Render
1. Go to **Render Dashboard** → Select your `mailsense-ai-backend` Web Service → **Environment**.
2. Update the following two variables:
   - `CLIENT_URL` = `https://mailsense-ai.vercel.app` *(Your Vercel URL)*
   - `GOOGLE_REDIRECT_URI` = `https://mailsense-ai-backend.onrender.com/api/email-accounts/oauth/callback` *(Your Render URL)*
3. Click **Save Changes** (Render will automatically redeploy with the updated variables).

---

### 4.2 Update Google Cloud Console for Production OAuth
1. Open **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Select your project (`Ai automation` / `MailSense AI`).
3. Go to **APIs & Services** → **Credentials**.
4. Click on your **OAuth 2.0 Client ID** to edit it.
5. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `https://mailsense-ai.vercel.app`
   - `https://mailsense-ai-backend.onrender.com`
6. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   - `https://mailsense-ai-backend.onrender.com/api/email-accounts/oauth/callback`
7. Click **SAVE**.

---

## Step 5: Verification & Testing Checklist

Test your live production deployment:

- [ ] **Health Check**: Open `https://<YOUR-RENDER-BACKEND-NAME>.onrender.com/api/health` in your browser. It should return status `"healthy"`.
- [ ] **Frontend**: Open `https://<YOUR-VERCEL-APP-NAME>.vercel.app`.
- [ ] **Registration & Login**: Create a new account on your live app.
- [ ] **Connect Gmail**: Go to **Accounts** → Click **Connect Gmail (OAuth)** → Sign in and authorize.
- [ ] **AI Summaries & Replies**: Open an email in your inbox, verify the AI summary generates, and test drafting an AI reply.
- [ ] **Compose & Send**: Send an email and check delivery.

---

🎉 **Your MailSense AI platform is now completely deployed and live in production!**
