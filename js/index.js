var remote = require('remote');
var ipcMain = require('electron').ipcMain;
var ipcRenderer = require('electron').ipcRenderer;

        function buildConfig() {
            //alert("starting buildConfig");
            var sqlConfig = {};
            var userName = document.getElementById("loginUserID").getAttribute("data-value");
            var passwordText = document.getElementById("loginUserPswd").getAttribute("data-value");
            var serverName = document.getElementById("loginServerAddr").getAttribute("data-value");
            var dbName = document.getElementById("loginDBName").getAttribute("data-value");

            if (userName && passwordText && serverName && dbName) {
                sqlConfig = {
                    user: userName,
                    password: passwordText,
                    server: serverName,
                    database: dbName
                };

            };
            
            return sqlConfig;
        };

        function getOrderViewFileName(orderNumber, orderType) {
//            var ipcRenderer = require('electron').ipcRenderer;
            var config = buildConfig(); 

            ipcRenderer.send('getOrderViewFileName', config, orderNumber, orderType);

            ipcRenderer.on('orderViewFileNameReply', function(event, fileName) {
                ipcRenderer.send('watchFile', fileName);
            });
            
            ipcRenderer.on('watchFileReply', function(event, fileName) {
                alert('file: ' + fileName + ' was created');
            });
        };



