# Rock Paper Scissors - Monorepo

A multiplayer Rock Paper Scissors game built with React, Socket.io, and TypeScript.

## Setup

1. Install root dependencies:
```bash
npm install
```

2. Install server dependencies:
```bash
cd server && npm install
```

3. Install client dependencies:
```bash
cd client && npm install
```

## Development

Run both client and server concurrently:
```bash
npm run dev
```

This will:
- Start the server on `http://localhost:3000`
- Start the client on `http://localhost:5173`

You should see "User connected" in the server terminal when the client connects.

## Project Structure

- `/shared` - TypeScript interfaces shared between client and server
- `/server` - Node.js/Express/Socket.io backend
- `/client` - React/Vite frontend
