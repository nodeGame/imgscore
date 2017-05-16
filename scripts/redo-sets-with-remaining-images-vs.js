var J = require('JSUS').JSUS;
var NDDB = require('NDDB').NDDB;
var path = require('path');
var fs = require('fs');
var util = require('util');
var ngc = require('nodegame-client');
var Matcher = ngc.Matcher;

var log = require('./log').log;
var logln = require('./log').logln;
var logln2 = require('./log').logln2;

// How many picture per set.
var PICS4SET = 20;

// How many evaluation per picture (target).
var EVAS4PIC = 5;

// If different from -1, then only at most LIMIT_PICS images will be used.
var LIMIT_PICS = 200;
// If true which pictures to include in LIMIT_PICS is random.
var LIMIT_PICS_SHUFFLE = true;

// If set, it is used to load partials results.
// var partialsDbFile = './all-images-list-nreviews-MAY04.csv';
var partialsDbFile = null;

// If FALSE, it throws an error if cannot make a set.
// If TRUE, it tries to use one item just already above the limit
// to complete the set. If not possible, it throws an error.
var BEST_EFFORT = true;

// Set variables.
var outDb =  new NDDB();

var origGlobalCounter;
var globalCounter = {};

var niter = 0;
var niterLimit = 10000;

var setsNiter = 0;
var setsNiterLimit = 1000;

// Out file (no extension, will add JSON and CSV).
var outFile = './sets-of-images-vs';

var i, j, idx, item;
var out, totItems;
var setIds;
var res;

// This is the some of remaining evaluations per image.
var requiredEvas = 0;
var origAvailableIdxs;
var availableIdxs = [];

function shuffleAvailableIdxs() {
    // Shuffle it nicely.
    J.shuffle(availableIdxs);
    J.shuffle(availableIdxs);
    J.shuffle(availableIdxs);
    J.shuffle(availableIdxs);
    J.shuffle(availableIdxs);
    J.shuffle(availableIdxs);
}

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

var db = fullDb;
totItems = db.size();


// Partials db: how many reviews each image already has got.
////////////////////////////////////////////////////////////

if ('string' === typeof partialsDbFile) {
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
    partialsDb.loadSync(partialsDbFile);
}
else {
    requiredEvas =  totItems * EVAS4PIC;
    availableIdxs = J.seq(0, (totItems-1));
}
//////////////////////////////////////////////////////


// LIMIT PICS if requested.
///////////////////////////
if ('number' === typeof LIMIT_PICS) {
    if (LIMIT_PICS_SHUFFLE) shuffleAvailableIdxs();
    availableIdxs = availableIdxs.slice(0, LIMIT_PICS);
    requiredEvas =  LIMIT_PICS * EVAS4PIC;
}
//////////////////////////

shuffleAvailableIdxs();

// availableIdxs is modified inside the function, keep a copy.
origAvailableIdxs = availableIdxs.slice(0);
origGlobalCounter = J.clone(globalCounter);

var auxDb = fullDb
    .select('N', '==', EVAS4PIC)
    .or('N', '==', EVAS4PIC+1)
    .execute();

if (!auxDb.size()) {
    auxDb = fullDb.random(PICS4SET*5);
}

auxDb.shuffle(true);
auxDb.shuffle(true);
auxDb.shuffle(true);
auxDb.shuffle(true);
auxDb.shuffle(true);
auxDb.shuffle(true);

// Update NSETS.

// var NSETS = totItems / PICS4SET * EVAS4PIC; //  = 1046; // 1045.5
var NSETS = requiredEvas / PICS4SET;

logln('n images: ' + totItems);
log('n images requiring evas: ' + availableIdxs.length);
log('required evaluations: ' + requiredEvas);
log('aux db size: ' + auxDb.size());
log('required sets: ' + NSETS);
logln('example item: ' + util.inspect(db.db[0]));

if (partialsDb && partialsDb.size() !== fullDb.size()) {
    logln('partialsDb images: ' + partialsDb.size());
}

var i, len;
i = -1, len = availableIdxs.length;
for ( ; ++i < len ; ) {
    if (globalCounter[availableIdxs[i]] >= EVAS4PIC) debugger    
}


var bestEffortedTot = 0;
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


function doSets() {
    var i;
    var i, j, idx, item;
    var out, totItems;
    var setIds;
    var res;
    var bestEfforted;

    // This is the sum of remaining evaluations per image.
    availableIdxs = origAvailableIdxs.slice(0);
    // All images reset counter.
    globalCounter = J.clone(origGlobalCounter);
    
    // Reset auxDb.
    auxDb.init({ nddb_pointer: 0 });

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
                    // console.log('aux: ', item.filename);
                    if (!item) {
                        throw new Error('Not enough aux items (1).');
                    }
                    db.insert(item);
                    idx = (db.db.length-1)
                    bestEfforted++;
                }
                else {
                    throw new Error('Niter limit reached: ' + niterLimit + 
                                '. Sets completed: ' + i + '/' + NSETS);
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
        if (bestEfforted > 0) {
            setInfo.bestEffort = bestEfforted;
            bestEffortedTot += bestEfforted;
        }
        outDb.insert(setInfo);
        // console.log(i);
    }

    debugger

    // Do last set with left over images, and repeat some other.



    // Something is left out.
    while (availableIdxs.length) {
        doLeftOver();        
        if (!BEST_EFFORT && availableIdxs.length) return false;
    }

    return true;
}

function doLeftOver() {
    var j, len;
    var idx, item;

    var set = [], setIds = {}; 
    var bestEfforted = 0;

    j = -1, len = availableIdxs.length;
    for ( ; ++j < len ; ) {
        idx = availableIdxs[j];
        item = db.db[idx];
        set.push(item.filename);
        setIds[idx] = true;
        // console.log(globalCounter[idx]);
        globalCounter[idx]++;
        if (idxManager.shouldBeCleared(idx)) {
            idxManager.clear(j);
            len--;
            j--;
        }
    }

    j = set.length-1;
    for ( ; ++j < PICS4SET ; ) {
        //debugger;
        item = auxDb.next();
        if (!item) {
            throw new Error('Not enough aux items (2).');
        }
        idx = item.idx;
        bestEfforted++;
        setIds[idx] = true;
        globalCounter[idx]++;
        set.push(item.filename);            
    }

    item = { set: i++, items : J.shuffle(set) };
    if (bestEfforted > 0) {
        item.bestEffort = bestEfforted;
        bestEffortedTot += bestEfforted;
    }
    outDb.insert(item);
}

// Here we go.
res = false;
while (!res && setsNiter++ < setsNiterLimit) {
    res = doSets();
    if (!res) log('remaining ' + availableIdxs.length + ' retrying...');
}

if (!res) {
    logln2('noooooooooo! could not make all sets. remaining imgs:  ' +
           availableIdxs.length);
    return;
}

logln('done! sets created: ' + outDb.size());
var tmp = outDb.fetchValues('bestEffort'); 
log('best effort sets(images): ' +
    tmp.bestEffort.length + '(' + bestEffortedTot + ')');

debugger

// Save db.
outDb.save(outFile + '.json');

// Save test db (to be loaded by R).
outDb.split('items').save(outFile + '.csv', function(err) {
    if (!err) {
        logln('You are served: ' + outFile);
        console.log();
    }
});