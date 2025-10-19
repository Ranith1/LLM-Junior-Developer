# Quick Start - Render Deployment

## TL;DR - Get Your App Online in 5 Steps

### Step 1: Setup MongoDB (5 minutes)
1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create a database user (username + password)
4. Allow all IPs (Network Access → 0.0.0.0/0)
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/junior_llm`

### Step 2: Get Your Keys
- **JWT Secret**: Run `openssl rand -base64 32` or use any 32+ char random string
- **OpenAI Key**: Get from https://platform.openai.com/api-keys

### Step 3: Push to GitHub
```bash
git add .
git commit -m "Add Render configuration"
git push origin main
```

### Step 4: Deploy on Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repo
4. Render detects `render.yaml` and creates 3 services

### Step 5: Add Environment Variables

**In Backend Service Settings:**
```
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/junior_llm
JWT_SECRET = your-generated-secret
FRONTEND_URL = https://llm-junior-developer-frontend.onrender.com
```

**In LLM Service Settings:**
```
OPENAI_API_KEY = sk-your-openai-key
FRONTEND_URL = https://llm-junior-developer-frontend.onrender.com
```

**In Frontend Service Settings:**
```
VITE_AUTH_BASE_URL = https://llm-junior-developer-backend.onrender.com
VITE_API_BASE_URL = https://llm-junior-developer-llm.onrender.com
```

Then click "Manual Deploy" on each service.

---

## What Changed in Your Code

### ✅ Fixed: `llm/server.py`
- CORS now allows production requests (not just localhost)
- Server binds to `0.0.0.0` (required for Render)
- Uses `PORT` environment variable

### ✅ Added: `render.yaml`
- Configures all 3 services for deployment
- Defines build and start commands
- Lists required environment variables

### ✅ Updated: `frontend/socratic-ui/src/api.tsx`
- Added comments explaining API configuration
- Uses environment variables for backend URLs

---

## Testing Your Deployment

1. **Backend Health**: Visit `https://your-backend.onrender.com/health`
   - Should return JSON: `{"status":"ok",...}`

2. **LLM Docs**: Visit `https://your-llm.onrender.com/docs`
   - Should show FastAPI documentation

3. **Frontend**: Visit `https://your-frontend.onrender.com`
   - Should load the app
   - Try signing up and chatting

---

## ⚠️ Important Notes

- **Free tier = cold starts**: Services sleep after 15 min inactivity, take 30-60s to wake up
- **Frontend env vars**: Must rebuild frontend if you change `VITE_*` variables
- **Backend env vars**: Can be changed anytime without rebuild

---

## Need Help?

See the full guide: `RENDER_DEPLOYMENT_GUIDE.md`

## Common Issues

| Problem | Solution |
|---------|----------|
| Backend won't start | Check MongoDB connection string and whitelist IPs |
| CORS errors | Verify `FRONTEND_URL` is set correctly (with https://) |
| Frontend shows errors | Check `VITE_AUTH_BASE_URL` and `VITE_API_BASE_URL` are correct |
| Slow first request | Normal on free tier - services "wake up" from sleep |

