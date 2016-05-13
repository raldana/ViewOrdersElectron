var remote = require('remote');
var ipcMain = require('electron').ipcMain;

ipcMain.on('sendBatch', function (ordNum, ordType) {
    ipcMain.send('sendBatch', ordNum, ordType);
}) 


