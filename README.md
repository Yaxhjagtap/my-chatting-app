# Real-Time Private Chat Application

A modern, high-performance, real-time messaging web application engineered for private, one-on-one communication. Built with a full-stack JavaScript architecture, this application features a sleek OLED dark-mode interface, real-time sync, message reactions, global editing and deletion, and custom emoji profiles.

---

## Features

* **Real-Time Messaging & Status**: Powered by WebSockets (Socket.IO) for zero-latency delivery, complete with live "typing..." indicators, delivery timestamps, and read receipts (single/double checkmarks).
* **Advanced Message Actions**: 
  * **Emoji Reactions**: Hover over any message bubble to drop quick reactions (❤️, 😂, 👍, 🔥, 😢, 🙏) with aggregated live counters.
  * **Message Editing**: Modify sent text messages inline with global real-time synchronization and an `(edited)` indicator.
  * **Global Deletion**: Instantly delete messages for both participants in real time.
* **Custom Emoji Profiles**: Secure authentication system paired with an interactive profile customizer allowing users to choose their display name and unique avatar emoji (e.g., 🦊, 🐼, 🚀, 😎).
* **Mobile-First Responsive Design**: Engineered with small viewport height handling (`100svh`) and keyboard-safe padding to ensure smooth mobile and desktop experiences.

---

## Tech Stack

* **Frontend**: Next.js (React), Tailwind CSS, Framer Motion, Lucide React
* **Backend & Real-Time**: Node.js custom server (`server.js`), Express/Next.js request handler, Socket.IO
* **Database**: MongoDB, Mongoose

---

## Getting Started Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine and a running [MongoDB](https://www.mongodb.com/) instance (or MongoDB Atlas cluster).

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
   cd your-repo-name