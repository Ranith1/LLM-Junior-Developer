# Render Deployment Guide - LLM Junior Developer

This guide will walk you through deploying your application to Render. The application consists of three separate services:

1. **Frontend** (React + Vite) - Static Site
2. **Backend** (Node.js + Express) - Web Service  
3. **LLM Server** (Python + FastAPI) - Web Service

## Prerequisites

- [ ] GitHub account with your repository pushed
- [ ] Render account (sign up at https://render.com)
- [ ] MongoDB Atlas account (free tier available at https://www.mongodb.com/cloud/atlas)
- [ ] OpenAI API key (get from https://platform.openai.com/api-keys)

---

## Step 1: Set Up MongoDB Atlas (Database)

Your backend needs a MongoDB database. We'll use MongoDB Atlas (cloud-hosted, free tier available).

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Create a new cluster** (select the free M0 tier)
3. **Create a database user**:
   - Go to "Database Access" → "Add New Database User"
   - Choose password authentication
   - Create username and password (save these!)
   - Grant "Read and Write to any database" privileges

4. **Whitelist all IP addresses** (for Render):
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is necessary because Render uses dynamic IPs

5. **Get your connection string**:
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/`)
   - Replace `<password>` with your actual password
   - Add your database name at the end: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/junior_llm`

---

## Step 2: Generate JWT Secret

Your backend needs a secret key for JWT tokens. Generate one using:

```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use any random string generator (at least 32 characters)
```

Save this secret - you'll need it in the next step.

---

## Step 3: Deploy to Render Using Blueprint (Recommended)

This method deploys all three services at once.

### 3.1: Push render.yaml to GitHub

First, ensure the `render.yaml` file is committed to your repository:

```bash
git add render.yaml
git commit -m "Add Render deployment configuration"
git push origin main
```

### 3.2: Create Blueprint on Render

1. **Log in to Render**: https://dashboard.render.com
2. **Click "New +" → "Blueprint"**
3. **Connect your GitHub repository**:
   - You may need to authorize Render to access your GitHub
   - Select your `LLM-Junior-Developer` repository
4. **Render will detect render.yaml** and show you all three services
5. **Click "Apply"** - but WAIT! You need to set environment variables first.

### 3.3: Set Environment Variables

Before the services can deploy successfully, you need to set the environment variables that are marked with `sync: false` in the render.yaml.

#### For Backend Service (`llm-junior-developer-backend`):

1. Go to the backend service page
2. Click "Environment" in the left sidebar
3. Add these variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1 |
| `JWT_SECRET` | Your generated secret from Step 2 |
| `FRONTEND_URL` | Will be: `https://llm-junior-developer-frontend.onrender.com` |

#### For LLM Server Service (`llm-junior-developer-llm`):

1. Go to the LLM service page
2. Click "Environment" in the left sidebar
3. Add these variables:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `FRONTEND_URL` | Will be: `https://llm-junior-developer-frontend.onrender.com` |

#### For Frontend Service (`llm-junior-developer-frontend`):

1. Go to the frontend service page
2. Click "Environment" in the left sidebar
3. Add these variables:

| Key | Value |
|-----|-------|
| `VITE_AUTH_BASE_URL` | Will be: `https://llm-junior-developer-backend.onrender.com` |
| `VITE_API_BASE_URL` | Will be: `https://llm-junior-developer-llm.onrender.com` |

**Note**: The service URLs above assume default naming. Check your actual service URLs in Render and update accordingly.

### 3.4: Deploy Services

1. Once environment variables are set, trigger a manual deploy for each service:
   - Go to each service page
   - Click "Manual Deploy" → "Deploy latest commit"

2. **Watch the logs** for each service to ensure they start successfully:
   - Backend should show: "MongoDB connected successfully" and "Server running"
   - LLM server should start without errors
   - Frontend should build and deploy the static files

---

## Step 4: Verify Deployment

### Check Each Service:

1. **Backend Health Check**:
   - Visit: `https://llm-junior-developer-backend.onrender.com/health`
   - Should return: `{"status":"ok","message":"Server is running","timestamp":"..."}`

2. **LLM Server Check**:
   - Visit: `https://llm-junior-developer-llm.onrender.com/docs`
   - Should show FastAPI's interactive documentation

3. **Frontend**:
   - Visit: `https://llm-junior-developer-frontend.onrender.com`
   - Should load your React application
   - Try signing up and logging in

---

## Alternative: Deploy Services Individually

If you prefer to deploy services one at a time instead of using Blueprint:

### Deploy Backend:

1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name**: `llm-junior-developer-backend`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - Set environment variables as described in Step 3.3

### Deploy LLM Server:

1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name**: `llm-junior-developer-llm`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd llm && python server.py`
   - Set environment variables as described in Step 3.3

### Deploy Frontend:

1. Click "New +" → "Static Site"
2. Connect your repository
3. Configure:
   - **Name**: `llm-junior-developer-frontend`
   - **Build Command**: `cd frontend/socratic-ui && npm install && npm run build`
   - **Publish Directory**: `frontend/socratic-ui/dist`
   - Set environment variables as described in Step 3.3

---

## Troubleshooting

### Backend Not Connecting to MongoDB
- **Check**: MongoDB Atlas IP whitelist includes 0.0.0.0/0
- **Check**: Connection string is correct (password, database name)
- **Check**: Database user has read/write permissions
- **View Logs**: In Render dashboard → Backend service → "Logs" tab

### LLM Server Not Starting
- **Check**: OpenAI API key is set correctly
- **Check**: `requirements.txt` has all dependencies
- **View Logs**: In Render dashboard → LLM service → "Logs" tab

### Frontend Can't Connect to Backend
- **Check**: Environment variables `VITE_AUTH_BASE_URL` and `VITE_API_BASE_URL` are set correctly
- **Important**: Frontend needs to be rebuilt after changing environment variables
- **Check**: CORS settings in backend allow your frontend URL

### Services Are Slow
- Render's free tier services "spin down" after 15 minutes of inactivity
- First request after inactivity may take 30-60 seconds to wake up
- Consider upgrading to a paid plan for always-on services

### CORS Errors
- **Check**: `FRONTEND_URL` is set correctly in backend and LLM services
- **Check**: Frontend URL matches what's in the environment variables (with https://)

---

## Important Notes

### Free Tier Limitations:
- Services spin down after 15 minutes of inactivity
- 750 hours/month of runtime per service (more than enough for personal use)
- Build time limit of 15 minutes
- Limited bandwidth

### Environment Variables:
- Frontend environment variables (`VITE_*`) are **baked into the build**
- If you change frontend env vars, you must **rebuild the frontend**
- Backend/LLM env vars can be changed without rebuilding

### Updating Your App:
1. Push changes to GitHub
2. Render will auto-deploy (if enabled) or click "Manual Deploy"
3. If you changed frontend env vars, redeploy the frontend

---

## Local Development Setup

To run the app locally after these changes:

### 1. Backend:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your local values
npm run dev
```

### 2. LLM Server:
```bash
cd llm
pip install -r requirements.txt
# Create .env file with OPENAI_API_KEY
python server.py
```

### 3. Frontend:
```bash
cd frontend/socratic-ui
npm install
cp .env.example .env.local
# Edit .env.local with local backend URLs
npm run dev
```

---

## Next Steps After Deployment

- [ ] Test all functionality (signup, login, chat, analytics, help requests)
- [ ] Set up custom domain (optional, available in Render settings)
- [ ] Monitor service logs for errors
- [ ] Consider upgrading to paid plans if you need:
  - Always-on services (no cold starts)
  - More bandwidth
  - Better performance

---

## Support

If you encounter issues:
1. Check the Render service logs
2. Review this guide's troubleshooting section
3. Check Render's documentation: https://render.com/docs
4. MongoDB Atlas documentation: https://docs.atlas.mongodb.com/

---

## Environment Variables Quick Reference

### Backend (.env)
```bash
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend-url.onrender.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/junior_llm
JWT_SECRET=your-generated-secret-here
```

### LLM Server (.env)
```bash
OPENAI_API_KEY=sk-...
FRONTEND_URL=https://your-frontend-url.onrender.com
PORT=10000
```

### Frontend (.env)
```bash
VITE_AUTH_BASE_URL=https://your-backend-url.onrender.com
VITE_API_BASE_URL=https://your-llm-url.onrender.com
```

Remember: Frontend variables must be set **before building**, and require a rebuild if changed!

