var J = require('JSUS').JSUS;
var path = require('path');
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

//  // Open the collection where the categories will be stored.
//var mdbWrite = ngdb.getLayer('MongoDB', {
//    dbName: 'facerank_db',
//    collectionName: 'facecats_sets_random'
//});

// Opening the database for writing.
//mdbWrite.connect(function(){

    mdb.connect(function() {
        
        var i, j, item;
        var totItems;

        var db = mdb.getDbObj();
        var collection = db.collection('facerank_col');
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
                    item = data[J.randomInt(0, totItems)];
                    
                    console.log(item);
                    //out.push(item);
                }
                //mdbWrite.store(out);
            } 
        });




   
    });

//});
