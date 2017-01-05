var J = require('JSUS').JSUS;
var fs = require('fs');
var path = require('path');
var NDDB = require('NDDB').NDDB;
var ngc = require('nodegame-client');
var node = ngc.getClient();
node.setup('nodegame', {});

var DIR = '/home/stefano/Dropbox/artex/AMT/out/ALL/faces/';

var nddb = new NDDB();

// Total count of files in all directories.
var count = 0;

// Opens all directories of images (1 dir per session)
fs.readdir(DIR, function(err, curFiles) {
    var i, len, filePath, fileName, obj;    
    var stat;

    // For every file in set (full Dir or subset of dir)
    // creates an object
    for (i = 0; i < curFiles.length; i++) {
        fileName = curFiles[i];
        filePath = DIR + fileName;
        stat = fs.lstatSync(filePath);
        if (stat.isFile()) {
            obj = parseFilename(DIR, fileName);
            if (!obj) continue;

            obj.count = ++count;
            obj.dir = DIR;
            obj.filename = curFiles[i];
            
            // Save into NDDB to reuse it later.
            nddb.insert(obj);
        }
    }

    nddb.save('./all-images-db.json');
});


// Parses a filename and returns an object with properties to be added to db.
function parseFilename(dir, filename) {
    var obj, tmp, treatment;
    if (filename.length < 3) return;
    tmp = filename.split('_');

    if (tmp[3] === 'part1') {
        treatment = tmp[3];
        player = tmp[4];
        round = 0;
    }
    else {
        treatment = tmp[3] + '_' + tmp[4];
        player = tmp[5];
        round = parseInt(tmp[6], 10);
    }

    obj = {
        date: tmp[0] + '_' + tmp[1] + '_' + tmp[2],
        treatment: treatment, 
        creator: player,
        round: round
    };
    return obj;
}