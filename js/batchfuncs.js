var ipcMain = require('electron').ipcMain;

function sendBatch(event, orderNo, orderType, config) {
  var sql = require('mssql');
  //console.log(config);

  sql.connect(config, function (err) {
    if (err !== null) {
      console.log(err);
    };

    var request = new sql.Request();
    request.input('OrderNumber', sql.VarChar(20), orderNo);
    request.input('OrderType', sql.Char, orderType);
    request.input('PrinterID', sql.VarChar(200), '');
    request.output('BatchID', sql.Int, 0);
    request.execute('odCreateDefaultJobAP')
      .then( function(recordsets, BatchID) {
        notifyBatchComplete(event, request.parameters.BatchID.value);
      })
      .catch(function (err) {
        console.log(err);
      });
    
    //sql.close();

  });

};

function notifyBatchComplete (event, batchID) {
  event.sender.send('notifyBatchReply', batchID);
  console.log('Batch: ' + batchID + ' is sent');
};

exports.sendBatch = sendBatch;