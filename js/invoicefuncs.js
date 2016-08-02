
var sql = require('mssql');
var folderName = '';
var imageName = '';
var outputName = '';

// function used to send output folder/file name to renderer proces
function notifyOutputName (event, folder, file) {
  if (folder) {
      folderName = folder;
  };
  
  if (file) {
      imageName = file;
  };
  
  if (folderName && imageName){
    outputName = folderName + imageName;
    //console.log('notifyOutputName - Output file is: ' + outputName + '\n');
    
    // send message with file name
    event.sender.send('orderViewFileNameReply', outputName);
    
    // reset the variables now that we are done
    outputName = "";
    folderName = "";
    imageName = "";
  }
};

// call functions to get output folder and file name
function getInvoiceFileName(event, config, orderNumber) {
  //console.log('getInvoiceFileName - orderNumber is: ' + orderNumber + '\n');
  sql.connect(config, function (err) {
    if (err !== null) {
        console.log(err);
        console.log('file name error');
      return;
    };

    getOutputFileFolder(event, orderNumber, 'I', notifyOutputName);
    getOutputFileName(event, orderNumber, notifyOutputName);
  });
};

// get the folder name used to dump the output file
function getOutputFileFolder(event, orderNumber, orderType, callback) {
  var outName = '';
  
  var request = new sql.Request();
  request.input('OrderNo', sql.VarChar(15), orderNumber);
  request.input('OrderType', sql.Char(1), orderType);
  request.input('BillingStatKey', sql.Int, 0);
  request.output('PathFileName', sql.VarChar(500), '');
  request.execute('odDisplayGetPrintImageFldrAP')
    .then( function(recordsets, PathFileName) {
      outName = request.parameters.PathFileName.value;
      callback(event, outName, imageName) ;
    })
    .catch(function (err) {
      console.log(err);
    });
};

// get the output file name
function getOutputFileName(event, orderNumber, callback) {
  var outName = '';
  
  var request = new sql.Request();
  request.input('InvoiceNo', sql.VarChar(15), orderNumber);
  request.input('DetailLevel', sql.Int, 0);
  request.output('DATFileName', sql.VarChar(500), '');
  request.execute('odDisplayInvBuildFileNameAP')
    .then( function(recordsets, DATFileName) {
      outName = request.parameters.DATFileName.value + '.pdf';
      callback(event, folderName, outName) ;
    })
    .catch(function (err) {
      console.log(err);
    });
};


exports.getInvoiceFileName = getInvoiceFileName;
