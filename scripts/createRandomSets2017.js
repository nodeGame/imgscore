var J = require('JSUS').JSUS;
var path = require('path');
var fs = require('fs');
var ngc = require('nodegame-client');
var NDDB = ngc.NDDB;
var node = ngc.getClient();

node.setup('nodegame', {
    debug: true
});

var PICS4SET = 60;
var NSETS = 1071;

var db;
var i, j, idx, item;
var out, totItems;
var setIds;

out = [];

// Load data.
data = [ { a: 1 }, { b : 2} ];

totItems = data.length;
console.log('data in facerank_sets_ordered: ', data[0]);
console.log();

i = -1;
for ( ; ++i < NSETS ; ) {
    j = -1;
    set = [];
    setIds = {};

    for ( ; ++j < PICS4SET ; ) {

        idx = J.randomInt(0, (totItems-1));
        while ('undefined' !== typeof setIds[idx]) {
            idx = J.randomInt(0, (totItems-1));
        }
        item = data[idx];
        setIds[idx] = '';

        // console.log(item);
        if ('undefined' === typeof item) {
            debugger
        }
        set.push(item.path);
    }

    db.insert( { set : set } );

    // console.log(i);
}

db.save('./images.db.json');