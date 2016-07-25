var chokidar = require('chokidar');
var fs = require('fs');
var fsPath = require('path');

var watchFile = function(event, watchedFile) {
    var folder = require('path').dirname(watchedFile);

    // Initialize watcher.
    var watcher = chokidar.watch('file', {
        ignored: /[\/\\]\./,
        persistent: true,

        ignoreInitial: true,
        followSymlinks: true,
        //cwd: '.',

        usePolling: true,
        interval: 100,
        binaryInterval: 300,
        alwaysStat: true,
        depth: 99,

        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
        }
        
        //atomic: true
    });

    // Something to use when events are received.
    var log = console.log.bind(console);
    // Add event listeners.
    watcher
    .once('add', function(path) {
        console.log('File', path, 'has been added');
        event.sender.send('watchFileReply', path);
        //watcher.unwatch(path);
        watcher.close();
    })

    .once('change', function(path) {
        console.log('File', path, 'has been changed' + "\n");
        event.sender.send('watchFileReply', path);
        //watcher.unwatch(path);
        watcher.close();
    });

    // Watch new files.
    watcher.add(watchedFile);
    
    // Get list of actual paths being watched on the filesystem
    var watchedPaths = watcher.getWatched();

    // Stop watching.
    // watcher.close();

};

var copyFile = function (event, source, target) {
  //console.log('completed copying file (' + source + ') to (' + target + ')');
  var cbCalled = false;
  
  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
      copyOk = false;
      done(err);
  });
  rd.on('open', function () {
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);
  });

  function done(err) {
    if (err) {
      console.log(err);  
    } else {
        if (!cbCalled) {
        event.sender.send('copyFileReply', target);
        cbCalled = true;
      }
    }
  }

};

var deleteFile = function (event, target) {
    if (target) {
        if (fileExists(target)) {
            fs.closeSync(target);
            fs.unlinkSync(target);
            console.log("File deleted successfully!" + "\n");
        } else {
            console.log("File not found!" + "\n");
        };
    };
    if (event) {
        event.sender.send('deleteFileReply', target);
    };
};


var fileExists = function(event, target) {
  var isExists = false;
  if (target) {
    var fstats = fs.statSync(target);
    console.log(fstats);
    if (fstats) {
        isExists = true;
/*
        if (fstats.isFile()) {
            isExists = true;
        };
*/
    };
  };
  return isExists;
};

exports.watchFile = watchFile;
exports.copyFile = copyFile;
exports.deleteFile = deleteFile;
exports.fileExists = fileExists;

/*
fs.stat('foo.txt', function(err, stat) {
    if(err == null) {
        console.log('File exists');
    } else if(err.code == 'ENOENT') {
        // file does not exist
        fs.writeFile('log.txt', 'Some log\n');
    } else {
        console.log('Some other error: ', err.code);
    }
});
*/