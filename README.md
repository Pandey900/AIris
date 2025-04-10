# 🚀 AIris: Collaborative AI-Powered Development Platform

![AIris Platform](https://via.placeholder.com/800x400?text=AIris+Platform)

---

## 🌟 Overview

**AIris** is a revolutionary **web-based collaborative development platform** that combines:

- 💬 Real-time group conversations  
- 🤖 Integrated AI assistance  
- 👨‍💻 Collaborative code editing  

AIris creates a **seamless environment** where developers can code, communicate, and receive AI guidance — all in one place.

---

## ✨ Key Features

### 🔄 Real-time Collaboration
- 💬 **Group Conversations**: Chat with team members in real-time  
- 👥 **Collaborator Management**: Add or remove team members easily  
- 👀 **Presence Awareness**: See who's active in your project  

### 🤖 AI-Powered Development
- 🧠 **Integrated AI Assistant**: Use `@ai` in chat for AI help  
- ⚙️ **Code Generation**: Generate snippets from natural language  
- 📖 **Code Explanations**: Understand existing code with AI  
- 💡 **Contextual Suggestions**: Get smart suggestions  

### 💻 Development Environment
- 📝 **Code Editor**: Syntax highlighting and code editing  
- 🗂️ **File Management**: Organize your project files  
- 🔁 **Live Preview**: Run and preview your code  
- 🛡️ **WebContainer**: Isolated execution for server-side code  

### 🧑‍🚀 Media & Communication
- 📎 **Rich Media Sharing**  
- 🎙️ **Voice Messages**  
- 🧩 **Code Snippets in Chat**  

---

## 🛠️ Technologies Used

| Layer            | Technologies                                |
|------------------|---------------------------------------------|
| **Frontend**     | React, TailwindCSS, Socket.io Client         |
| **Backend**      | Node.js, Express, MongoDB                   |
| **Real-time**    | Socket.io, Redis                            |
| **AI Integration**| Google Gemini API                           |
| **Execution**    | WebContainer API                            |
| **Auth**         | JWT (JSON Web Tokens)                       |
| **Media**        | Multer, Express-fileupload                  |

---

## 📋 Prerequisites

- Node.js v16+
- MongoDB
- Redis
- Google Gemini API Key

---

## 🚀 Getting Started

### 📦 Installation

```bash
git clone https://github.com/yourusername/AIris.git
cd AIris


🔧 Install Dependencies

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install


⚙️ Environment Setup

Backend .env

PORT=5000
MONGODB_URI=mongodb://localhost:27017/airis
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
REDIS_URL=redis://localhost:6379

Frontend .env
VITE_API_URL=http://localhost:5000/api

▶️ Run Development Servers

# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev

💻 Usage Guide
🆕 Create New Project
Register or log in

Go to Dashboard → Click New Project

Fill in details → Click Create

👥 Invite Collaborators
Open project → Click Add Collaborators

Search, select users → Click Add Selected

🤖 Use AI Assistant
Chat examples:
@ai How do I implement a search function?
@ai Generate a React component for user profile
@ai Explain this code: [paste code]

🏗️ Architecture Overview
Frontend: React SPA with Context API

Backend: RESTful Express API + JWT

Real-time: Socket.io + Redis adapter

AI Service: Google Gemini API

Execution: WebContainer sandbox

🤝 Contributing
We welcome contributions! Please check our Contributing Guide.

📄 License
Licensed under the MIT License. See LICENSE for details.

🙏 Acknowledgements
🔒 WebContainer API — Secure code execution

🤖 Google Gemini — AI capabilities

🔌 Socket.io — Real-time magic

⚛️ React — Frontend power

🌍 Open Source Community — ❤️

