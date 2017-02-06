var J = require('JSUS').JSUS;
var NDDB = require('NDDB').NDDB;
var path = require('path');
var fs = require('fs');

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

// Load db of iamges.
db.loadSync('./sets-of-images.json');
NSETS = db.size();
PICS4SET = db.db[0].items.length;
console.log('n sets: ', NSETS);
console.log('images for set: ', PICS4SET);
console.log('sample set: ', db.db[0]);
console.log();


// Here we go.

var item, set, incompSet;

i = -1;
for ( ; ++i < (NSETS-1) ; ) {
    j = -1;
    set = db.db[i];
    set.previousIncompatibleSets = {};
    set.nextIncompatibleSets = {};
    set.allIncompatibleSets = {};
debugger
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

}


console.log('sample updated set: ', db.db[0]);

// Save db.
db.save('./sets-of-images-extra.json');

console.log('You are served.');

