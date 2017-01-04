var J = require('JSUS').JSUS;
var NDDB = require('NDDB').NDDB;
var path = require('path');
var fs = require('fs');
var ngc = require('nodegame-client');
var node = ngc.getClient();

var PICS4SET = 40;
var NSETS = 1071;

var i, j, idx, item;
var out, totItems;
var setIds;

var db = new NDDB({ update: { indexes: true } });
db.view('round01', function(item) {
    if (item.round < 2) return item;
});

db.loadSync('./all-images-db.json');
totItems = db.size();
db.shuffle(true);

var outDb =  new NDDB();
debugger

console.log('image example: ', db.db[0]);
console.log('n images: ', totItems);
console.log();

i = -1;
for ( ; ++i < NSETS ; ) {
    j = -1;
    set = [];
    setIds = {};

    for ( ; ++j < PICS4SET ; ) {

        idx = J.randomInt(-1, (totItems-1));
        while ('undefined' !== typeof setIds[idx]) {
            idx = J.randomInt(0, (totItems-1));
        }
        item = db.db[idx];
        setIds[idx] = '';

        // console.log(item);
        if ('undefined' === typeof item) {
            debugger
        }

        set.push(item.filename);
    }
    outDb.insert( { set : set } );
    // console.log(i);
}

outDb.save('./sets-of-images.json');

