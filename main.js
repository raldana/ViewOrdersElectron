const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// for dev: auto re-loading when source code changes
require('electron-reload')(__dirname);

// Module ipc for inter-process communication
const ipcMain = require('electron').ipcMain

// sql connection
//const sendBatch = require('./js/sendBatch')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1024, height: 768})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

function sendBatch(orderNo, orderType, config) {
  var sql = require('mssql');
  console.log(config);

  sql.connect(config, function (err) {
    if (err !== null) {
      console.log(err);
    }

    var request = new sql.Request();
    request.input('OrderNumber', sql.VarChar(20), orderNo);
    request.input('OrderType', sql.Char, orderType);
    request.input('PrinterID', sql.VarChar(200), '');
    request.output('BatchID', sql.Int, 0);
    request.execute('odCreateDefaultJobAP')
      .then( function(recordsets, BatchID) {
        console.log('BatchID:' + request.parameters.BatchID.value);
      })
      .catch(function (err) {
        console.log(err);
      });
    
    sql.close();

    //if (request.parameters.BatchID.value != null) {
     // console.log('BatchID:' + request.parameters.BatchID.value);
    //}

  });

};

function testConn(config) {
  var sql = require('mssql');
  console.log(config);

  var isConnected;

  sql.connect(config).then(function() {
    isConnected = true;
  }).catch(function(err) {
    isConnected = false;
  });

  console.log("Connect state" + isConnected)
  if (err !== null) {
    console.log(err);
  }
  sql.close();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// send batch
ipcMain.on('sendBatch', function(event, orderNumber, orderType, config) {
  console.log('sending batch...');
  sendBatch(orderNumber, orderType, config);
});

// test sql connection
ipcMain.on('testConn', function(event, config) {
  console.log('testing sql connection...');
  testConn(config);
});

// debug console
ipcMain.on('consoleLog', function(event, msg) {
  console.log(msg);
});

