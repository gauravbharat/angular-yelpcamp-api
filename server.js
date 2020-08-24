require('dotenv').config();
const app = require('./app');
const debug = require('debug')('node-angular');
const http = require('http');

const normalizePort = (val) => {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string' ? 'pipe ' + port : 'port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof port === 'string' ? 'pipe ' + port : 'port ' + port;
  debug('Listening on ' + bind);
};

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

/** 24082020 - Gaurav - add server to socket */
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('client-UI connected');
  // socket.emit('server-message', { msg: 'hey how are ya' });

  socket.on('new-comment', (data) => {
    io.emit('new-comment', { campgroundId: data.campgroundId });
  });

  socket.on('edit-comment', (data) => {
    io.emit('edit-comment', { campgroundId: data.campgroundId });
  });

  socket.on('delete-comment', (data) => {
    io.emit('delete-comment', { campgroundId: data.campgroundId });
  });

  socket.on('new-campground', (data) => {
    io.emit('new-campground', { campgroundId: data.campgroundId });
  });

  socket.on('edit-campground', (data) => {
    io.emit('edit-campground', { campgroundId: data.campgroundId });
  });

  socket.on('delete-campground', (data) => {
    io.emit('delete-campground', { campgroundId: data.campgroundId });
  });
});

server.on('error', onError);
server.on('listening', onListening);
server.listen(port);
