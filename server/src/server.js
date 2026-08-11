const app = require('./app');
const config = require('./config');
const http = require('http');
const { Server } = require('socket.io');

const port = config.PORT || 5001;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// attach io to app so controllers can emit
app.set('io', io);

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', () => {
    // console.log('socket disconnected', socket.id);
  });
});

const server = httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other process or set a different PORT.`);
    process.exit(1);
  } else {
    console.error('Server error', err);
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.info('SIGTERM received, shutting down');
  io.close();
  server.close(() => process.exit(0));
});
