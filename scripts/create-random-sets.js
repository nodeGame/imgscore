var J = require('JSUS').JSUS;
var NDDB = require('NDDB').NDDB;
var path = require('path');
var fs = require('fs');
var ngc = require('nodegame-client');
var Matcher = ngc.Matcher;

var PICS4SET = 8;
var MAXSETS = 5;

var i, j, idx, item;
var out, totItems;
var setIds;

var db = new NDDB({ update: { indexes: true } });
db.view('round01', function(item) {
    if (item.round < 2) return item;
});
db.index('filename', function(item) {
    return item.filename;
});

// Load db of iamges.
db.loadSync('./all-images-db.json');

// Save all images as a list.
// db.save('./all-images-list.csv', { headers: [ 'filename' ] });

totItems = db.size();
console.log('image example: ', db.db[0]);
console.log('n images: ', totItems);
console.log();

// Shuffle it nicely.
db.shuffle(true);
db.shuffle(true);
db.shuffle(true);
db.shuffle(true);
db.shuffle(true);
db.shuffle(true);

// Set variables.
var outDb =  new NDDB();
var globalCounter = {};
var idxLimit = 5;
var niter = 0;
var niterLimit = 10000;


// How many sets we need to create.
var NSETS = totItems / PICS4SET * MAXSETS; 
debugger
// Here we go.

i = -1;
for ( ; ++i < (NSETS-1) ; ) {
    j = -1;
    set = [];
    setIds = {};

    for ( ; ++j < PICS4SET ; ) {

        niter = 1;
        idx = J.randomInt(-1, (totItems-1));

        // Generate random idx until a valid one is found.

        // Must not be in set.
        while (('undefined' !== typeof setIds[idx] ||
                // Must not be used more idxLimit.
                globalCounter[idx] >= idxLimit) &&
               // We must not get stuck in the loop.
               niter < niterLimit) {
            
            niter++;
            idx = J.randomInt(0, (totItems-1));
            // console.log(niter);
        }

        if (niter >= niterLimit) {
            throw new Error('Niter limit reached: ' + niterLimit + 
                            '. Sets completed: ' + i);
        }

        item = db.db[idx];
        // console.log(item);

        if ('undefined' === typeof item) {
            // debugger;
            throw new Error('No item found with idx: ' + idx);
        }

        // Update registers.
        setIds[idx] = true;
        if ('undefined' === typeof globalCounter[idx]) {
            globalCounter[idx] = 1;
        }
        else {
            globalCounter[idx]++;
        }

        // Add item to current set.
        set.push(item.filename);
    }

    // Add set to db.
    outDb.insert( { set: i, items : set } );
    // console.log(i);
}

debugger

// Do last set with left over images, and repeat some other.
var set = [], setsIds = {};
for (idx in globalCounter) {
    if (globalCounter.hasOwnProperty(idx)) {
        if (globalCounter[idx] < idxLimit) {
            item = db.db[Number(idx)];
            set.push(item.filename);
            setsIds[idx] = true;
            console.log(globalCounter[idx]);
            globalCounter[idx]++;
        }
    }
}

j = set.length;
for ( ; ++j < PICS4SET ; ) {
    idx = J.randomInt(-1, (totItems-1));
    while ('undefined' !== typeof setIds[idx]) {        
        idx = J.randomInt(0, (totItems-1));
    }
    setIds[idx] = true;
    globalCounter[idx]++;
    item = db.db[Number(idx)];
    set.push(item.filename);
            
}
outDb.insert( { set: i++, items : J.shuffle(set) } );
console.log('---');

// Do it twice.
set = [], setsIds = {};
for (idx in globalCounter) {
    if (globalCounter.hasOwnProperty(idx)) {
        if (globalCounter[idx] < idxLimit) {
            item = db.db[Number(idx)];
            set.push(item.filename);
            setsIds[idx] = true;
            console.log(globalCounter[idx]);
            globalCounter[idx]++;
        }
    }
}
j = set.length;
for ( ; ++j < PICS4SET ; ) {
    idx = J.randomInt(-1, (totItems-1));
    while ('undefined' !== typeof setIds[idx]) {        
        idx = J.randomInt(0, (totItems-1));
    }
    setIds[idx] = true;
    globalCounter[idx]++;
    item = db.db[Number(idx)];
    set.push(item.filename);
            
}
outDb.insert( { set: i++, items : J.shuffle(set) } );
console.log('---');

// console.log(globalCounter);

// Save db.
outDb.save('./sets-of-images.json');

// Save test db (to be loaded by R).
outDb.split('items').save('./sets-of-images.csv');

console.log('You are served.');

