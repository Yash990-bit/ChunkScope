# 🔍 ChunkScope

### **Visual RAG Analytics & Strategy Optimization Platform**

ChunkScope is a powerful tool designed to help developers and AI researchers visualize, experiment with, and optimize their Retrieval-Augmented Generation (RAG) pipelines. By providing deep insights into chunking strategies, retrieval performance, and generation quality, ChunkScope takes the guesswork out of building reliable AI applications.

---

## 🌐 Live Access

| Component | Hosted URL |
| :--- | :--- |
| **Frontend** | [chunk-scope.vercel.app](https://chunk-scope.vercel.app/) |
| **Backend API** | [chunkscope.onrender.com](https://chunkscope.onrender.com) |

---

## 📽️ Project Overview

ChunkScope bridges the gap between raw text data and high-performance RAG systems. It allows you to:
- **Visualize** how different chunking strategies split your documents.
- **Benchmark** various retrieval methods (Vector, BM25, Hybrid) in real-time.
- **Evaluate** groundedness and relevance of generated answers.
- **Optimize** your pipeline with intelligent strategy recommendations.

## 🏗️ Repository Structure

- **`/frontend`**: Interactive Next.js application for visual analysis.
- **`/backend`**: High-performance FastAPI server handling document processing and AI evaluations.

---

## 🚀 Local Development Setup

### 1. Backend Setup
1. **Navigate**: `cd backend`
2. **Environment**: Create a `.env` file with your `OPENAI_API_KEY`.
3. **Install**: `pip install -r requirements.txt`
4. **Run**: `python main.py`
5. **Access**: Local API runs at `http://localhost:8000`

### 2. Frontend Setup
1. **Navigate**: `cd frontend`
2. **Install**: `npm install`
3. **Environment**: Create a `.env.local` file with `NEXT_PUBLIC_API_URL=http://localhost:8000`.
4. **Run**: `npm run dev`
5. **Access**: Local UI runs at `http://localhost:3000`

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15+, React 19, TypeScript, Recharts, Framer Motion |
| **Backend** | Python 3.9+, FastAPI, Pydantic, Uvicorn |
| **AI/ML** | OpenAI GPT-4o, BM25, Vector Embeddings |
| **Hosting** | Vercel (Frontend), Render (Backend) |

---

## 📖 Deployment Documentation

Detailed instructions for production hosting can be found in the **[DEPLOYMENT.md](./DEPLOYMENT.md)** guide.

---

## 🤝 Contributing

Contributions are welcome! Whether it's adding new chunking strategies, improving retrieval algorithms, or enhancing the UI, feel free to open an issue or submit a pull request.

---

*Built for the next generation of RAG engineers.*
