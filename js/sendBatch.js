var remote = require('remote');

var sendBatch = function (orderNo, orderType) {
    var sql = require('mssql');

    var config = {
    user: 'aris',
    password: 'Datdbmae(@360)',
    server: 'WS08TEST',
    database: 'RA_Envision'
    };

    sql.connect(config, function (err) {
        if (err !== null) {
            alert(err);
        }
        var batchId = 0;
        var request = new sql.Request();
        request.input('OrderNo', sql.VarChar(20), orderNo);
        request.input('OrderType', sql.Char, orderT);
        request.output('BatchID', sql.Int, batchId);
        request.execute('odCreateDefaultJobAP');
        request.catch(function (err) {
            alert(err);
        });

    });

};

module.exports = sendBatch;