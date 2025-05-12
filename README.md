
<div align="center">

# 🌟 Xeno CRM – Customer Engagement Platform

**A lightweight, AI-powered CRM for next-gen marketing and customer management.**

![Xeno CRM Architecture](https://i.ibb.co/tySxWMH/Screenshot-2025-05-12-at-3-14-16-PM.png)

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
├── api/                     # Backend APIs
│   ├── campaigns.js         # Campaign endpoints
│   └── customers.js         # Customer endpoints
├── public/
│   └── logo.svg             # App logo
├── src/
│   ├── App.tsx              # Main app
│   ├── index.css            # Tailwind styles
│   ├── main.tsx             # Entry point
│   ├── server.js            # Express server
│   ├── vapi.sdk.ts          # VAPI AI SDK
│   ├── components/
│   │   └── Layout.tsx       # App layout
│   ├── context/
│   │   └── AuthContext.tsx  # Auth state
│   ├── lib/
│   │   └── db.js            # MongoDB logic
│   ├── pages/               # App pages
│   │   ├── AddCustomer.tsx
│   │   ├── Agent.tsx
│   │   ├── CampaignBuilder.tsx
│   │   ├── CampaignHistory.tsx
│   │   ├── CustomerList.tsx
│   │   ├── Dashboard.tsx
│   │   └── LoginPage.tsx
│   ├── types/
│   │   └── index.ts         # Shared TS types
├── .env.production
├── vite.config.ts
├── package.json
├── tailwind.config.js
├── seed-data.js
├── index.html
├── tsconfig.*.json          # TypeScript configs
├── postcss.config.js
├── api-dev-server.js
├── vercel.json
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
