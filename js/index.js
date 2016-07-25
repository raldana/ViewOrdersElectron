var remote = require('electron').remote;

var ipcRenderer = require('electron').ipcRenderer;

var isFileDone = false;

// listen for shutdown
ipcRenderer.on('shutdownApp', function() {
    console.log('shutting down...');
    resetViewOrderPane();
});

// connect to db
function connectToDB () {
    // get the server address and db name
    var myServerAddr = document.getElementById("serverAddrText").value;
    var myDBName = document.getElementById("dbNameText").value;
    
    // update the text for the db connect modal
    document.getElementById("dbNameLabel").innerHTML = myDBName;
    document.getElementById("serverAddrLabel").innerHTML = myServerAddr;
    
    // save to document properties
    document.getElementById("loginServerAddr").setAttribute("data-value", myServerAddr);
    document.getElementById("loginDBName").setAttribute("data-value", myDBName);
};

// save the db config object (server name, db, etc.)
function saveConfig () {
    // get the auth type (Windows or SQL Server)
    var authType = document.getElementById("loginAuthType").getAttribute("data-value");
    // ipcRenderer.send('consoleLog', "saveConfig() login auth type: " + loginAuthType);
    
    // get the user and password
    var myUserName = document.getElementById("userNameText").value;
    var myPasswordText = document.getElementById("userPswdText").value;

    document.getElementById("loginUserID").setAttribute("data-value", myUserName);
    document.getElementById("loginUserPswd").setAttribute("data-value", myPasswordText);
    document.getElementById("loginAuthType").setAttribute("data-value", authType);

    testConn(authType);
};

function testConn (loginAuthType) {
    var config = buildConfig();
    var myStatus = document.getElementById("connStatusText");
    
    if (loginAuthType == "W" || (config.user && config.password && config.server && config.database)) {
        ipcRenderer.send('testConn', config);
    };
    
    ipcRenderer.once('testConnReply', function(event, connectState) {
        if (connectState == true) {
            // change the connect status text/color
            myStatus.style.color = "green";
            myStatus.innerHTML = "Connected";
            document.getElementById("connectButton").innerHTML = "Disconnect";
        } else {
            // change the connect status text/color
            myStatus.style.color = "red";
            myStatus.innerHTML = "Connect failed";
            document.getElementById("connectButton").innerHTML = "Connect";
        };
    });
};

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
};

function submitOrder () {
    ipcRenderer.send('consoleLog', '-----------------------');
    ipcRenderer.send('consoleLog', 'submitOrder is launched');
    
    // set isFileDone to false each time we submit a job
    isFileDone = false;

    // clear out any old files we have viewed first
    var tmpFile = remote.getGlobal('sharedObj').tempFile;
    console.log('var tmpFile: ' + tmpFile);
    if (tmpFile) {
        console.log('global temp file is: ' + tmpFile);
        ipcRenderer.send('deleteFile', tmpFile);
    };
    
    // get the Order Type selector's value and associated text of the option
    var orderTypeSelector = document.getElementById("orderTypeSelector");
    var myOrderType = orderTypeSelector.value;
    var optionText = orderTypeSelector.options[orderTypeSelector.selectedIndex].text;
    
    // get the order number
    var myOrderNumber = document.getElementById("submitOrderNumber").getAttribute("data-value");
    ipcRenderer.send('consoleLog', 'Order Number is: ' + myOrderNumber + ' will be submitted' + '\n');

    // reset view pane
    resetViewOrderPane();
    
    // show spinner while waiting
    $('#viewOrderPane').innerHTML = "waiting for order: " + myOrderNumber  + '<br/>' +
        '<i class="fa fa-gear fa-spin" style="font-size:24px"></i>';

    // update the text for the job submitted modal
    document.getElementById("orderSubmittedLabel").innerHTML = myOrderNumber + " [" + optionText + "]";
    
    // build sql connect config object
    var myConfig = buildConfig(); 
    
    // call sql stored proc to insert row to job queue/batches
    ipcRenderer.send('sendBatch', myOrderNumber, myOrderType, myConfig);
    
    // now get the file name for the order so we can watch for it
    ipcRenderer.once('notifyBatchReply', function(event, batchID) {
        ipcRenderer.send('consoleLog', 'Batch: ' + batchID + ' reply is received' + '\n');
        getDisplayFileName(myOrderNumber, myOrderType);
    });
    
    // write to the view pane
    //viewOrderPane
    //document.getElementById("viewOrderPane").innerHTML = "Waiting on order: " + myOrderNumber;
};

function buildConfig () {
    var sqlConfig = {};
    var authType = document.getElementById("loginAuthType").getAttribute("data-value");
    var userName = document.getElementById("loginUserID").getAttribute("data-value");
    var passwordText = document.getElementById("loginUserPswd").getAttribute("data-value");
    var serverName = document.getElementById("loginServerAddr").getAttribute("data-value");
    var dbName = document.getElementById("loginDBName").getAttribute("data-value");
    var dbDriver = document.getElementById("dbDriver").getAttribute("data-value");

    if (authType == "W") {
            sqlConfig = {
                driver: dbDriver,
                server: serverName,
                database: dbName,
                options: {
                    trustedConnection: true
                }
            };
        
    } else {
        if (userName && passwordText && serverName && dbName) {
            sqlConfig = {
                user: userName,
                password: passwordText,
                server: serverName,
                database: dbName
            };

        };
    };

    
    return sqlConfig;
};

function getDisplayFileName (orderNumber, orderType) {
    var config = buildConfig();

    ipcRenderer.send('consoleLog', '\n' + 'getDisplayFileName order parameter is: ' + orderNumber + '\n');

    ipcRenderer.send('getOrderViewFileName', config, orderNumber, orderType);

    ipcRenderer.once('orderViewFileNameReply', function(event, fileName) {
        ipcRenderer.send('consoleLog','orderViewFileNameReply filename is: ' + fileName + '\n');
        ipcRenderer.send('deleteFile', fileName);
        ipcRenderer.once('deleteFileReply', function(event, fileName) {
            ipcRenderer.send('consoleLog','deleteFileReply filename is: ' + fileName + '\n');
            ipcRenderer.send('watchFile', fileName);
            ipcRenderer.once('watchFileReply', function(event, fileName) {
                ipcRenderer.send('consoleLog','getDisplayFileName - found target: ' + fileName + '\n');
                if (isFileDone == false) {
                    isFileDone = true;
                    loadPDF(fileName);
                };
            });
            
        });
/*
        ipcRenderer.send('consoleLog', 'checking if pdf file exists: ' + fileName);
        if (fileExists(fileName)) {
            ipcRenderer.send('deleteFile', fileName);
        };
*/
//        ipcRenderer.send('watchFile', fileName);
        //ipcRenderer.removeAllListeners('orderViewFileNameReply');
    });

/*    
    ipcRenderer.on('watchFileReply', function(event, fileName) {
        console.log('getOrderViewFileName - found target: ' + fileName)
        if (isFileDone == false) {
            isFileDone = true;
            loadPDF(fileName);
            //ipcRenderer.removeListener('watchFileReply', fileName);
        }
    });
*/
};

function loadPDF(fname) {
    var source = fname;
/*
    // make sure the file doesn't already exist locally (maybe from previous testing)
    if (fileExists(__dirname + '\\web\\' + require('path').basename(fname))) {
        ipcRenderer.send("deleteFile", __dirname + '\\web\\' + require('path').basename(fname));
    };
*/
    var target = 'web/' + require('path').basename(fname);
    ipcRenderer.send("copyFile", source, target);
    ipcRenderer.once('copyFileReply', function(event, target) {
        var newTarget = require('path').basename(target);
        var uri = encodeURIComponent(newTarget);
        ipcRenderer.send("consoleLog", "got target: " + uri);
        ipcRenderer.send("updateTempFileName", target);
        $('#viewOrderIframe').attr('src', 'web/viewer.html?file=' + uri);
        document.getElementById('viewOrderIframe').style.display = 'block';
        $('#viewOrderIframe').show();
    });
};

function fileExists(target) {
  console.log('file exists from index.js: ' + isExists);
  var fs = require('fs');
  var isExists = false;
  var fstats = fs.statSync(target);
  if (fstats) {
    if (fstats.isFile()) {
      isExists = true;
    };
  };
  return isExists;
};

function resetViewOrderPane() {
    ipcRenderer.send('consoleLog', 'resetting iframe');
    var mySrc = $('#viewOrderIframe').attr('src');
    ipcRenderer.send('consoleLog', 'variable mySrc is: ' + mySrc);
    //$('#viewOrderIframe').attr('src', '');
    if (mySrc) {
        $('#viewOrderIframe').attr('src', '');
        $('#viewOrderIframe').hide();
    };
};

function saveOS() {
    var dbDriver = "";

    var platformOS = remote.getGlobal('sharedObj').platformOS;

    if (platformOS == "win32") {
        dbDriver = "msnodesqlv8";
    } else {
        dbDriver = "tedious";
    };

    document.getElementById("platformOS").setAttribute("data-value", platformOS);
    document.getElementById("dbDriver").setAttribute("data-value", dbDriver);
    //ipcRenderer.send("consoleLog", "renderer says OS is: " + platformOS);
    if (platformOS == "win32") {
        // default authorization type to "W" (windows authentication)
        document.getElementById("loginAuthType").setAttribute("data-value", "W");

        // update connect db div to show Windows Authorization as default
        showWindowsAuth();
    } ;

}

function showWindowsAuth() {
    document.getElementById('authSelectorLabel').style.display = 'block';
    document.getElementById('authSelector').style.display = 'block';
    document.getElementById('authSelectorBreak').style.display = 'block';
    $('#userNameText').prop('disabled', true);
    $('#userPswdText').prop('disabled', true); 
}