const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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
    console.log(`User connected: ${socket.id}`);

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

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on port ${port}`);
  });
});