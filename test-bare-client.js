
const net = require('bare-net');
const pipePath = "\\\\.\\pipe\\test-pipe-1783768771541";

console.log('Bare: Connecting to pipe:', pipePath);
try {
  const socket = net.connect(pipePath);
  
  socket.on('connect', () => {
    console.log('Bare: Connected successfully!');
    socket.write('Hello from Bare!');
    socket.end();
  });

  socket.on('error', (err) => {
    console.error('Bare Error event:', err.message, err.stack);
  });

  socket.on('close', () => {
    console.log('Bare: Socket closed');
  });
} catch (err) {
  console.error('Bare Catch block error:', err.message, err.stack);
}
