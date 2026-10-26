// Use the CLI's graceful shutdown handler on Windows, where kill(SIGINT)
// otherwise terminates the process without running Storage cleanup.
process.on('message',message=>{if(message==='shutdown')process.emit('SIGINT');});
require('../node_modules/firebase-tools/lib/bin/firebase.js');
