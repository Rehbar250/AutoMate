# ⚡ AutoMate — AI Agent Automation Platform

An intelligent, AI-powered automation platform that understands natural language, plans multi-step tasks, and executes them using a modular tool system — like Zapier meets ChatGPT.

## 🎯 What It Does

Type a command like **"Generate a report from sales data"** and the AI agent will:
1. 🧠 Understand your intent
2. 📋 Plan a multi-step execution strategy
3. 🔧 Select and chain the right tools (API fetcher, data analyzer, file processor, etc.)
4. ⚡ Execute each step with real-time progress updates
5. 📊 Deliver results with full reasoning transparency

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **AI Agent Engine** | Natural language → structured task plans → automated execution |
| **Chain-of-Thought** | See the agent's reasoning for each step |
| **5 Built-in Tools** | Email sender, API fetcher, data analyzer, file processor, web scraper |
| **Real-Time Streaming** | SSE-powered live execution logs with step-by-step progress |
| **Workflow Builder** | Create, save, and re-run reusable automation workflows |
| **Memory System** | Context-aware responses that learn from your usage patterns |
| **Execution History** | Full audit trail with expandable step details |
| **JWT Authentication** | Secure user accounts with bcrypt password hashing |
| **Demo Mode** | Works without an API key using intelligent task simulation |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│  React Frontend (Vite)                          │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │Dashboard │ AI Agent │Workflows │ History  │  │
│  │          │ (Chat)   │ Builder  │          │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
└───────────────────┬─────────────────────────────┘
                    │ REST API + SSE
┌───────────────────┴─────────────────────────────┐
│  Node.js / Express Backend                      │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │ Agent    │ Planner  │ Executor │ Memory   │  │
│  │ Engine   │ (LLM)    │          │ System   │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
│  ┌──────────────────────────────────────────┐   │
│  │ Tool Registry                             │   │
│  │ 📧 Email  🌐 API  📊 Data  📁 File  🔍 Web │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────┐                                   │
│  │ SQLite   │ Users, Workflows, Executions, Logs│
│  └──────────┘                                   │
└─────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite, React Router, vanilla CSS with design system
- **Backend**: Node.js + Express, JWT auth, SSE streaming
- **Database**: SQLite (via sql.js — zero config, portable)
- **AI**: OpenAI API (optional — demo mode works without it)

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/AutoMate.git
cd AutoMate

# 2. Install all dependencies
npm run install:all

# 3. Set up environment (optional — demo mode works without API key)
cp .env.example .env
# Edit .env to add your OPENAI_API_KEY for real AI planning

# 4. Start the dev servers
npm run dev
```

The app will be available at **http://localhost:5173**

## 📁 Project Structure

```
AutoMate/
├── client/                # React frontend
│   └── src/
│       ├── api/           # API client
│       ├── context/       # Auth context
│       ├── components/    # Layout components
│       └── pages/         # Dashboard, Agent, Workflows, History, Tools
├── server/                # Express backend
│   ├── agent/             # AI engine, planner, executor, memory
│   ├── db/                # SQLite database module
│   ├── middleware/        # JWT auth middleware
│   ├── routes/            # API route handlers
│   └── tools/             # Modular tool system
└── legacy/                # Original SharePoint→PowerBI sync agent
```

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `OPENAI_API_KEY` | No | OpenAI API key (enables real AI planning) |
| `PORT` | No | Backend server port (default: 3001) |

## 💡 Demo Mode

Without an OpenAI API key, the platform runs in **intelligent demo mode**:
- Uses keyword-based intent classification
- Generates realistic multi-step plans
- Executes real tools with simulated data
- Full chain-of-thought reasoning displayed

## 📜 License

MIT
