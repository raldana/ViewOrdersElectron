function getOrderFileName(event, orderNumber, orderType) {
  var outName = orderType + 'O-' + orderNumber + '_0.pdf';
  event.sender.send('orderViewFileNameReply', outName);
};

exports.getOrderFileName = getOrderFileName;