var J = require('JSUS').JSUS;
var NDDB = require('NDDB').NDDB;
var path = require('path');
var fs = require('fs');
var util = require('util');

var log = require('./log').log;
var logln = require('./log').logln;
var logln2 = require('./log').logln2;



var PICS4SET, NSETS;
var db =  new NDDB({ update: { indexes: true } });

var sets4images = {};
db.on('insert', function(item) {
    var i, len;
    i = -1, len = item.items.length;
    for ( ; ++i < len ; ) {
        if (!sets4images[item.items[i]]) sets4images[item.items[i]] = {};
        sets4images[item.items[i]][item.set] = true;
    }

});

// Load db of images.

var inFile, outFile;

// inFile = './sets-of-images-final-MAY04_LAST2SETS.json';
// Without extension.
inFile = './sets-of-images-vs';

// outFile = './sets-of-images-final-extra-MAY04_LAST2SETS.json';
outFile = inFile + '-inc';


db.loadSync(inFile + '.json');

NSETS = db.size();
PICS4SET = db.db[0].items.length;
logln('n sets: ' + NSETS);
log('images for set: ' + PICS4SET);
log('sample set: ' +  util.inspect(db.db[0]));


// Here we go.

var item, set, incompSet;

i = -1;
for ( ; ++i < NSETS ; ) {
    j = -1;
    set = db.db[i];
    set.previousIncompatibleSets = {};
    set.nextIncompatibleSets = {};
    set.allIncompatibleSets = {};

    for ( ; ++j < PICS4SET ; ) {
        item = set.items[j];
        for (incompSet in sets4images[item]) {
            if (sets4images[item].hasOwnProperty(incompSet)) {
                if (incompSet > i) set.nextIncompatibleSets[incompSet] = true;
                else set.previousIncompatibleSets[incompSet] = true;
                set.allIncompatibleSets[incompSet] = true;
            }
        }
    }
    // console.log(set);
    // debugger
}


logln('sample updated set: ' + util.inspect(db.db[0]));

// Save db.
db.save(outFile + '.json');

logln2('You are served.');

