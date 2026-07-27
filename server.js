const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Tracking Maps for Online/Offline Status
const socketUserMap = new Map(); // Maps socket.id -> username
const userStatusMap = new Map(); // Maps username -> { isOnline, lastSeen }

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // 1. Send the current online/offline status of everyone to the new connection
    socket.emit('initial_statuses', Array.from(userStatusMap.entries()));

    // 2. When a user logs in / connects
    socket.on('user_connected', (username) => {
      socketUserMap.set(socket.id, username);
      userStatusMap.set(username, { isOnline: true, lastSeen: null });
      
      console.log(`${username} is online`);
      // Broadcast to everyone else
      io.emit('user_status_update', { username, isOnline: true, lastSeen: null });
    });

    socket.on('send_message', (data) => {
      io.emit('receive_message', data);
    });

    socket.on('typing', (data) => {
      socket.broadcast.emit('user_typing', data);
    });

    socket.on('mark_seen', (data) => {
      io.emit('message_seen_update', data);
    });

    socket.on('edit_message', (data) => {
      io.emit('message_edited', data);
    });

    socket.on('delete_message', (data) => {
      io.emit('message_deleted', data);
    });

    socket.on('add_reaction', (data) => {
      io.emit('reaction_added', data);
    });

    // 3. When a user closes the tab / app
    socket.on('disconnect', () => {
      const username = socketUserMap.get(socket.id);
      if (username) {
        console.log(`${username} went offline`);
        const lastSeen = new Date().toISOString();
        
        // Update server memory
        userStatusMap.set(username, { isOnline: false, lastSeen });
        socketUserMap.delete(socket.id);
        
        // Tell frontend they went offline
        io.emit('user_status_update', { username, isOnline: false, lastSeen });
      }
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on port ${port}`);
  });
});