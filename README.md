# 🚀 Cohort Community Platform

> **A place where developers don't just learn together — they build together.**

A full-stack community platform built for our cohort to collaborate, communicate, share ideas, organize events, and grow together.

---

## ✨ Features

- 💬 Real-time chat with Socket.IO
- 📰 Community feed for posts and updates
- 📅 Event creation and RSVP system
- ⏰ Scheduled announcements
- 🔐 Secure authentication
- 📱 Fully responsive UI
- 🤝 Collaboration-focused experience

---

## 🛠️ Tech Stack

| Frontend | Backend | Database | Real-Time |
|----------|----------|----------|-----------|
| React + Vite | Node.js + Express | MongoDB Atlas | Socket.IO |

**Other Tools**

- Tailwind CSS
- JWT Authentication
- REST APIs

---



## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/Aayush-Mistri/cohort-master.git
cd cohort-master
```

### Install dependencies

```bash
cd cohortfront
npm install
cd ..
cd cohortbackend
npm install
```

### Configure Environment Variables

Create a `.env` file inside the server folder.

```env
PORT=5000
MONGO_URI=(### 📦 Get Your MongoDB URI

Create a free MongoDB Atlas account → Create a Cluster → Create a Database User → Add your IP Address (or allow `0.0.0.0/0`) → Click **Connect** → Select **Drivers (Node.js)** → Copy the Connection String (MongoDB URI) → Paste it into your `.env` file as `MONGODB_URI`.)

JWT_SECRET=YOUCANTYPEANYTHINGHERE

CLOUDINARY_URL=(Get the Cloudinary free api key from their official site)
GEMINI_API_KEY=(Get it from Google AI studio)
GEMINI_MODEL=gemini-2.5-flash

```

### Start the development server

In first terminal
```bash
cd cohortfront
npm run dev
```

In second terminal
```bash
cd cohortbackend
npm run dev
```

---

## 🎯 Vision

Our goal is to create a developer-first community where members can:

- Build projects together
- Discover teammates
- Share learning resources
- Organize events
- Network with fellow developers
- Learn through collaboration

---

## 🗺️ Roadmap

- [x] Authentication
- [x] Community Feed
- [x] Real-time Chat
- [x] Events & RSVP
- [ ] Notifications
- [ ] AI Assistant
- [ ] Project Matching
- [ ] Hackathon Leaderboard
- [ ] Dark Mode

---

## 🤝 Contributing

Contributions are always welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!

---

<div align="center">

### 💙 Built by the Cohort, for the Cohort.

*"Learn together. Build together. Grow together."*

</div>
