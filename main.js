const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// for dev: auto re-loading when source code changes
require('electron-reload')(__dirname);

// Module ipc for inter-process communication
const ipcMain = require('electron').ipcMain;

// javascript files
var jsconn = require('./js/connfuncs.js');
var jsbatch = require('./js/batchfuncs.js');
var jsinvoice = require('./js/invoicefuncs.js');
var jsorder = require('./js/orderfuncs.js');
var jsfs = require('./js/fsfuncs.js');

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
    mainWindow = null;
  })
}

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
  jsbatch.sendBatch(event, orderNumber, orderType, config);
});

// test sql connection
ipcMain.on('testConn', function(event, config) {
  console.log('testing sql connection...');
  jsconn.testConn(config, event);   // js/connfuncs.js
});

// get order file name
ipcMain.on('getOrderViewFileName', function(event, config, orderNumber, orderType) {
  //console.log('getting file name...');
  //console.log(config);
  if (orderType == 'A' || orderType == 'O') {
    jsinvoice.getInvoiceFileName(event, config, orderNumber);
  } else {
    jsorder.getOrderFileName(event, orderNumber, orderType);
  };
  
});

// debug console function for use by renderer processes
ipcMain.on('consoleLog', function(event, msg) {
  console.log(msg);
});

// watch for file
ipcMain.on('watchFile', function (event, fname) {
  console.log('started watching for file: ' + fname);
  jsfs.watchFile(event, fname);
});
