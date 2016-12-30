// Observer.

var ngc = require('nodegame-client');
var node = ngc.getClient();

node.setup('nodegame', {	  
	name: "FaceRankAdmin",
	host: "http://localhost:8080",
	verbosity: 0,
	debug: false,
	socket: {
	      type: 'SocketIo',
	      reconnect: false
	}
      });
debugger      
// Connecting.
node.connect("/facerank/admin");

module.exports = node;
