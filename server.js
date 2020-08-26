require('dotenv').config();
const app = require('./app');
const debug = require('debug')('node-angular');
const http = require('http');
const { isValidObjectId } = require('mongoose');

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

/** 24082020 - Gaurav - add server to socket
 * use api namespace for this socket connection
 */
const io = require('socket.io')(server);
const api = io.of('/api');

api.use(async (socket, next) => {
  // console.log(socket.request.headers);

  // if (isValid(socket.request)) {
  next();
  // } else {
  //   next(new Error('invalid socket request'));
  // }
});

api.on('connection', (socket) => {
  /** Join specific room */
  socket.on('join', (data) => {
    socket.join(data.roomId);
    api.in(data.roomId).emit('new-user-joined', data);
  });

  socket.on('chat-user-left', (data) => {
    socket.leave(data.roomId);
    api.to(data.roomId).emit('chat-user-left', data);
  });

  socket.on('new-chat-message', (data) => {
    api.in(data.roomId).emit('new-chat-message', data);
  });

  /** App refresh specific socket io events */
  socket.on('new-comment', (data) => {
    api.emit('new-comment', { campgroundId: data.campgroundId });
  });

  socket.on('edit-comment', (data) => {
    api.emit('edit-comment', { campgroundId: data.campgroundId });
  });

  socket.on('delete-comment', (data) => {
    api.emit('delete-comment', { campgroundId: data.campgroundId });
  });

  socket.on('new-campground', (data) => {
    api.emit('new-campground', { campgroundId: data.campgroundId });
  });

  socket.on('edit-campground', (data) => {
    api.emit('edit-campground', { campgroundId: data.campgroundId });
  });

  socket.on('delete-campground', (data) => {
    api.emit('delete-campground', { campgroundId: data.campgroundId });
  });

  // socket.on('disconnecting', () => {
  //   const rooms = Object.keys(socket.rooms);
  //   console.log('inside disconnecting: rooms', rooms);
  // });

  // socket.on('disconnect', () => {
  //   const rooms = Object.keys(socket.rooms);
  //   console.log('inside disconnect: rooms', rooms);
  // });
});

server.on('error', onError);
server.on('listening', onListening);
server.listen(port);
