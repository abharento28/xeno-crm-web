
<div align="center">

# 🌟 Xeno CRM – Customer Engagement Platform

**A lightweight, AI-powered CRM for next-gen marketing and customer management.**

![Xeno CRM Architecture](https://i.ibb.co/tySxWMH/Screenshot-2025-05-12-at-3-14-16-PM.png)

### 🌐 Hosted Live at: [https://xero-crm-web.vercel.app](https://xero-crm-web.vercel.app)

</div>

---

## 🚀 Features at a Glance

✨ **Google OAuth Login** — Secure and easy sign-in  
👥 **Customer Management** — Add, view, and delete customer records  
🎯 **Campaign Builder** — Filter-based targeted campaign creation  
📬 **Message Delivery Simulation** — Simulate delivery attempts with logging  
🕰️ **Campaign History** — Performance metrics & campaign logs  
🧠 **AI Integration** — Campaign messages and summaries powered by OpenAI  
📱 **Responsive UI** — Built with TailwindCSS for seamless experience across devices  

---

## 🏗️ Project Structure

```bash
xeno-crm-website/
├── api/                     # Backend API routes
│   ├── campaigns.js         # API for managing campaigns
│   ├── customers.js         # API for managing customers
├── public/                  # Static assets
│   └── logo.svg             # Logo for the app
├── src/
│   ├── App.tsx              # Main React app entry point
│   ├── index.css            # TailwindCSS styles
│   ├── main.tsx             # React DOM rendering
│   ├── server.js            # Express server for APIs
│   ├── vapi.sdk.ts          # VAPI SDK integration
│   ├── vite-env.d.ts        # Vite environment types
│   ├── components/          # Reusable React components
│   │   └── Layout.tsx       # Layout component for the app
│   ├── context/             # React context for global state
│   │   └── AuthContext.tsx  # Authentication context
│   ├── lib/                 # Utility functions and database logic
│   │   └── db.js            # MongoDB connection and models
│   ├── pages/               # Frontend pages
│   │   ├── AddCustomer.tsx  # Add customer page
│   │   ├── Agent.tsx        # AI assistant page
│   │   ├── CampaignBuilder.tsx # Campaign creation page
│   │   ├── CampaignHistory.tsx # Campaign history page
│   │   ├── CustomerList.tsx # Customer management page
│   │   ├── Dashboard.tsx    # Dashboard page
│   │   └── LoginPage.tsx    # Login page
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Shared types for the app
├── .env.production          # Environment variables for production
├── api-dev-server.js        # Development server for APIs
├── eslint.config.js         # ESLint configuration
├── index.html               # HTML entry point
├── package.json             # Project dependencies and scripts
├── postcss.config.js        # PostCSS configuration
├── seed-data.js             # Script to seed the database with sample data
├── tailwind.config.js       # TailwindCSS configuration
├── tsconfig.app.json        # TypeScript configuration for the app
├── tsconfig.json            # TypeScript base configuration
├── tsconfig.node.json       # TypeScript configuration for Node.js
├── vercel.json              # Vercel deployment configuration
├── vite.config.ts           # Vite configuration
```

---

## ⚙️ Local Setup Instructions

> 💡 **Tip:** Make sure Node.js (v18+) and MongoDB are installed.

### 1. 📥 Clone the Repository

```bash
git clone https://github.com/abharento28/xeno-crm-web.git
cd xeno-crm-web
```

### 2. 📦 Install Dependencies

```bash
npm install
```

### 3. 🔐 Configure Environment Variables

Create a `.env` file in the root:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/xeno-crm
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
OPENAI_API_KEY=<your-openai-api-key>
```

### 4. 🌱 Seed the Database (Optional)

```bash
node seed-data.js
```

### 5. ▶️ Start Development Server

```bash
npm run dev
```

### 🌐 Visit: [https://xero-crm-web.vercel.app](https://xero-crm-web.vercel.app)

---

## 🧠 Tech Stack & AI Tools

| Tool         | Purpose                                      |
|--------------|----------------------------------------------|
| 🔮 OpenAI API | Generate campaign messages & rule summaries |
| 🤖 VAPI SDK   | Embedded conversational AI agent            |
| 🎨 TailwindCSS | Modern, responsive UI styling              |
| ⚛️ React       | Frontend user interface framework          |
| 🧩 Express     | Node.js server for API handling            |
| 🗃 MongoDB     | NoSQL database for storing user data       |

---

## ⚠️ Known Limitations

- 🔒 **Mock Authentication** – OAuth is simulated for demo purposes  
- 📩 **Delivery Simulation** – 90% success simulation, no real vendor integration  
- 🧠 **AI Reliance** – Dependent on OpenAI/VAPI uptime and cost  
- 🚫 **Limited Error Handling** – Basic error handling implemented  
- 📡 **No Real-Time Updates** – Campaign and customer changes aren't live-updated  

---

## 🏛 Architecture Overview

![Architecture Diagram](https://i.ibb.co/M5yRNHFn/diagram-export-12-05-2025-14-28-50.png)



## 💬 Feedback or Questions?

Feel free to open issues or discussions in the repo. Contributions are welcome!
