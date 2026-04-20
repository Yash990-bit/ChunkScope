# ChunkScope Deployment Guide 🚀

Follow these steps to deploy your RAG analytics platform to the web.

## 1. Backend Deployment (FastAPI) on [Render](https://render.com)

Render is recommended for hosting the Python backend.

### Setup Steps:
1. **Connect GitHub**: Connect your repository to Render.
2. **New Web Service**: Select the repository.
3. **Configuration**:
   - **Name**: `chunkscope-api` (or your choice)
   - **Environment**: `Python 3`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`
4. **Environment Variables**:
   - `OPENAI_API_KEY`: Your real OpenAI key.
   - `ALLOWED_ORIGINS`: Set this to your frontend URL later (e.g., `https://chunkscope.vercel.app`) or use `*` for testing.

---

## 2. Frontend Deployment (Next.js) on [Vercel](https://vercel.com)

Vercel is the native home for Next.js and provides the best performance.

### Setup Steps:
1. **New Project**: Import your GitHub repository.
2. **Framework Preset**: Vercel will auto-detect **Next.js**.
3. **Root Directory**: Select the `frontend` folder.
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Paste the URL provided by your Render deployment (e.g., `https://chunkscope-api.onrender.com`).
5. **Deploy**: Click deploy and wait for the success message.

---

## ⚡ Option 2: Vercel Unified Deployment (Fastest)

You can now deploy both the frontend and backend to a single Vercel project using the included `vercel.json`.

### Setup Steps:
1. **New Project**: Import the root of your repository to Vercel.
2. **Project Settings**: 
   - Vercel will detect the `vercel.json` and orchestrate the services.
3. **Environment Variables**:
   - `OPENAI_API_KEY`: Required in the Project Settings.
   - `ROOT_PATH`: Set this to `/_api` to match the routing in `vercel.json`.
4. **Deploy**: Vercel handles the routing so your frontend and backend live on the same domain!

---

## 3. Checklist for Success

- [ ] **OpenAI API**: Ensure your OpenAI account has credits, as production usage will hit your quota.
- [ ] **CORS**: If you get "Failed to fetch" on the live site, check that `ALLOWED_ORIGINS` on Render matches your Vercel URL.
- [ ] **Data Security**: Never commit your `.env` files to GitHub. Use the platform dashboards for secrets.

## Support
If you encounter errors during deployment, check the **Logs** tab on Render/Vercel for specific error messages.
