var J = require('JSUS').JSUS;
var path = require('path');
var fs = require('fs');
var ngc = require('nodegame-client');
var node = ngc.getClient();
node.setup('nodegame', {
    debug: true
});

var Database = require('nodegame-db').Database;
var ngdb = new Database(node);


var mdb = ngdb.getLayer('MongoDB', {
    dbName: 'facerank_db',
    collectionName: 'facerank_col'
});

var PICS4SET = 60;
var NSETS = 400;

// Open the collection where the categories will be stored.
var mdbWrite = ngdb.getLayer('MongoDB', {
    dbName: 'facerank_db',
    collectionName: 'facecats_sets_random'
});

// Opening the database for writing.
mdbWrite.connect(function() {

    mdb.connect(function() {
        var db, collection;
        var i, j, idx, item;
        var out, totItems;

        out = [];
        db = mdb.getDbObj();
        collection = db.collection('facerank_col');

        collection.find().toArray(function(err, data) {
            totItems = data.length;
            console.log('data in facerank_sets_ordered: ', data[0]);
            console.log();
            //sets = data;
            //mdbLoad.disconnect();

            i = -1;
            for ( ; ++i < NSETS ; ) {
                j = -1;
                set = [];
                for ( ; ++j < PICS4SET ; ) {
                    debugger
                    idx = J.randomInt(-1, (totItems-1));
                    item = data[idx];
                    // console.log(item);
                    if ('undefined' === typeof item) {
                        debugger
                    }
                    set.push(item.path);
                }
                debugger
                // mdbWrite.store( { set : set } );
                // out.push(set);
            }
//            console.log(out.length);
//            console.log(out[9].length);

            mdb.disconnect();
            mdbWrite.disconnect();
        });

    });

});
