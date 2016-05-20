var chokidar = require('chokidar');

var watchFile = function(event, watchedFile) {
    var folder = require('path').dirname(watchedFile);

    // Initialize watcher.
    var watcher = chokidar.watch('file', {
        ignored: /[\/\\]\./,
        persistent: true,

        ignoreInitial: true,
        followSymlinks: true,
        //cwd: folder,

        usePolling: true,
        interval: 100,
        binaryInterval: 300,
        alwaysStat: true,
        depth: 99,

        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
        }
    });

    // Something to use when events are received.
    var log = console.log.bind(console);
    // Add event listeners.
    watcher
    .on('add', function(path) {
        console.log('File', path, 'has been added');
        event.sender.send('watchFileReply', path);
        watcher.close();
    });

    // Watch new files.
    watcher.add(watchedFile);
    
    // Get list of actual paths being watched on the filesystem
    var watchedPaths = watcher.getWatched();

    // Stop watching.
    // watcher.close();

};

exports.watchFile = watchFile;