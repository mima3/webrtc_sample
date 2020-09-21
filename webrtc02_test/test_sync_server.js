const ipc=require('node-ipc');

ipc.config.id   = 'testsync';
ipc.config.retry = 1500;
//ipc.config.silent = true
const events = [];


ipc.serve(
  function() {
    ipc.server.on(
      'event',
      function(data, socket){
        console.log('receive event : ', data);
        events.push(data)
        ipc.server.broadcast(
          'event',
          data
        );
      }
    );
    ipc.server.on(
      'connect',
      function(socket) {
        console.log('connected');
        for(const event of events) {
          console.log(event)
          ipc.server.emit(socket, 'event', event)
        }
      }
    );
  }
);

ipc.server.start();
