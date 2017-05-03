var J = require('JSUS').JSUS;
var NDDB = require('NDDB').NDDB;
var path = require('path');
var fs = require('fs');
var ngc = require('nodegame-client');
var Matcher = ngc.Matcher;

// How many picture per set.
var PICS4SET = 20;

// How many evaluation per picture (target).
var EVAS4PIC = 5;

// If FALSE, it throws an error if cannot make a set.
// If TRUE, it tries to use one item just already above the limit
// to complete the set. If not possible, it throws an error.
var BEST_EFFORT = false;

// Set variables.
var outDb =  new NDDB();
var globalCounter = {};

var niter = 0;
var niterLimit = 10000;


var i, j, idx, item;
var out, totItems;
var setIds;

// This is the some of remaining evaluations per image.
var requiredEvas = 0;
var availableIdxs = [];

// Full db: all images.
///////////////////////

var fullDb = new NDDB({ update: { indexes: true } });
fullDb.view('round01', function(item) {
    if (item.round < 2) return item;
});
fullDb.index('filename', function(item) {
    return item.filename;
});
var counter = 0;
fullDb.on('insert', function(item, idx) {
    // Returning here because NDDB.select.execute re-executes this handler.
    if ('undefined' !== typeof item.idx) return;
    item.idx = idx;    
});
fullDb.loadSync('./all-images-db.json');
////////////////////////////////////


// Partials db: how many reviews each image already has got.
////////////////////////////////////////////////////////////

var partialsDb = new NDDB({ update: { indexes: true } });
partialsDb.index('filename', function(item) {
    return item.filename;
});

partialsDb.on('insert', function(item, idx) {
    var fullItem, diffEvas;
    fullItem = fullDb.filename.get(item.filename);
    if (!fullItem) {
        debugger;
        throw new Error('Missing fullItem ' + item.filename);
    }
    fullItem.N = item.N;
    globalCounter[fullItem.idx] = item.N;

    // Update counter of required imags.
    diffEvas = Math.max(EVAS4PIC - item.N, 0);
    if (diffEvas > 0) {
        requiredEvas += diffEvas;
        availableIdxs.push(fullItem.idx);
    }
});
partialsDb.loadSync('./all-images-list-nreviews-MAY03.csv');
//////////////////////////////////////////////////////

//var db = fullDb.select('N', '<', EVAS4PIC).execute();

var db = fullDb;
var auxDb = fullDb
    .select('N', '==', EVAS4PIC)
    .or('N', '==', EVAS4PIC+1)
    .execute();

totItems = db.size();


// Shuffle it nicely.
J.shuffle(availableIdxs);
J.shuffle(availableIdxs);
J.shuffle(availableIdxs);
J.shuffle(availableIdxs);
J.shuffle(availableIdxs);
J.shuffle(availableIdxs);

auxDb.shuffle(true);
auxDb.shuffle(true);
auxDb.shuffle(true);
auxDb.shuffle(true);
auxDb.shuffle(true);
auxDb.shuffle(true);

// Update NSETS.

// var NSETS = totItems / PICS4SET * EVAS4PIC; //  = 1046; // 1045.5
var NSETS = requiredEvas / PICS4SET;

console.log();
console.log(' ** example image: ', db.db[0]);
console.log(' ** n images: ', totItems);
console.log(' ** n images requiring evas: ', availableIdxs.length);
console.log(' ** required evaluations: ', requiredEvas);
console.log(' ** required sets: ', NSETS);
console.log();
if (partialsDb.size() !== fullDb.size()) {
    console.log('!!!partialsDb images: ' + partialsDb.size());
}

var i, len;
i = -1, len = availableIdxs.length;
for ( ; ++i < len ; ) {
    if (globalCounter[availableIdxs[i]] >= 5) debugger    
}


var bestEfforted;
var setInfo;

// TODO closure and eliminate last index.
var idxManager = (function() {
    var idx, internalIdx;
    return {
        // Return the next idx in fullDb.
        // Stores local references of both idx and internalIdx.
        getNext: function() {
            if (!availableIdxs.length) throw new Error('No more Idxs!');
            internalIdx = J.randomInt(-1, (availableIdxs.length-1));
            idx = availableIdxs[internalIdx];
            return idx;
        },
        // If reached the target of evaluations, we remove it.
        clearIfNeeded: function(idxTarget) {
            if (idxTarget !== idx) throw new Error('Wrong idx ' + idxTarget);
            if (idxManager.shouldBeCleared(idx)) idxManager.clear(internalIdx);
        },
        shouldBeCleared: function(idx) {
            return globalCounter[idx] >= EVAS4PIC;
        },
        clear: function(idx) {
            availableIdxs.splice(idx, 1);
        }
    }
})();

// Here we go.

i = -1;
for ( ; ++i < (NSETS-1) ; ) {
    j = -1;
    set = [];
    setIds = {};
    bestEfforted = 0;

    for ( ; ++j < PICS4SET ; ) {

        niter = 1;
        idx = idxManager.getNext();

        // Generate random idx until a valid one is found.

        // Must not be in set.
        while (('undefined' !== typeof setIds[idx] ||
                // Must not be used more EVAS4PIC.
                globalCounter[idx] >= EVAS4PIC) &&
               // We must not get stuck in the loop.
               niter < niterLimit) {
            
            niter++;
            idx = idxManager.getNext();
        }

        if (niter >= niterLimit) {
            debugger
            if (BEST_EFFORT) {
                // console.log('Pic ', j, 'Set ', i);
                
                //debugger;
                item = auxDb.next();
                db.insert(item);
                idx = (db.db.length-1)
                bestEfforted++;
            }
            else {
                throw new Error('Niter limit reached: ' + niterLimit + 
                                '. Sets completed: ' + i);
            }
        }

        item = db.db[idx];
        // console.log(item);

        if ('undefined' === typeof item) {
            throw new Error('No item found with idx: ' + idx);
        }

        if (globalCounter[idx] >= EVAS4PIC || item.N >= EVAS4PIC) {
            throw new Error('This item is wrong: ' + idx);
        }

        // Update registers.
        setIds[idx] = true;
        if ('undefined' === typeof globalCounter[idx]) {
            globalCounter[idx] = 1;
        }
        else {
            globalCounter[idx]++;
            idxManager.clearIfNeeded(idx);
        }

        // Add item to current set.
        set.push(item.filename);
    }

    // Add set to db.
    setInfo = { set: i, items : set };
    if (bestEfforted > 0) setInfo.bestEffort = bestEfforted;
    outDb.insert(setInfo);
    // console.log(i);
}

debugger

// Do last set with left over images, and repeat some other.
var set = [], setsIds = {};
var i, len;
j = -1, len = availableIdxs.length;
for ( ; ++j < len ; ) {
    idx = availableIdxs[j];
    item = db.db[idx];
    set.push(item.filename);
    setsIds[idx] = true;
    // console.log(globalCounter[idx]);
    globalCounter[idx]++;
    if (idxManager.shouldBeCleared(idx)) {
        idxManager.clear(j);
        len--;
        j--;
    }
}
j = -1;
for ( ; ++j < PICS4SET ; ) {
     //debugger;
    item = auxDb.next();
    idx = item.idx;
    bestEfforted++;
    setIds[idx] = true;
    globalCounter[idx]++;
    set.push(item.filename);            
}
outDb.insert( { set: i++, items : J.shuffle(set), bestEffort: true } );

if (availableIdxs.length) {
    console.log('noooooooooo ', availableIdxs.length);
    return;
}

debugger

var tmp = outDb.fetchValues('bestEffort');
console.log(tmp.bestEffort.length);

debugger

// Save db.
outDb.save('./sets-of-images-final-MAY03.json');

// Save test db (to be loaded by R).
outDb.split('items').save('./sets-of-images-final-MAY03.csv');

console.log('You are served.');

