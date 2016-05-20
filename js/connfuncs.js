// Module ipc for inter-process communication
const ipcMain = require('electron').ipcMain;

function testConn(config, event) {
  
  console.log(config);
  
  var sql = require('mssql');
  var isConnected = true;

  var connection = new sql.Connection(config);

  connection.connect(function(err) {
    if (err !== null) {
    isConnected = false;
      console.log(err);
    }
    connection.close();
    notifyConnState(event, isConnected);
  });
 
};

function notifyConnState (event, connState) {
  event.sender.send('testConnReply', connState);
  console.log('Connection state: ' + connState);
};

exports.testConn = testConn;
