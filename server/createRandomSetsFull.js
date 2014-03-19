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
var NSETS = 714;

// Each picture cannot be repeated more than PICLIMIT times across all sets.
var PICLIMIT = 10;

// Open the collection where the categories will be stored.
var mdbWrite = ngdb.getLayer('MongoDB', {
    dbName: 'facerank_db',
    collectionName: 'facecats_sets_random_full'
});

// Opening the database for writing.
mdbWrite.connect(function() {
    
    mdb.connect(function() {
        var db, collection;
        var i, j, idx, item;
        var set, out, totItems;
        var globalSetIds, setIds;
        
        var pool, poolIdx, reAdd2Pool;

        globalSetIds = {};
        out = [];
        db = mdb.getDbObj();
        collection = db.collection('facerank_col');
        
        collection.find().toArray(function(err, data) {
            totItems = data.length;
            console.log('data in facerank_sets_ordered: ', data[0]);
            console.log();
            
            pool = J.sample(0,(totItems-1))

            i = -1;
            for ( ; ++i < NSETS ; ) {
                j = -1;
                set = [];
                setIds = {};
                
                // Re-add the element that was added last before the re-fill.
                if ('undefined' !== typeof reAdd2Pool) {
                    pool.push(reAdd2Pool);
                    reAdd2Pool = undefined;
                }
                for ( ; ++j < PICS4SET ; ) {
                    poolIdx = J.randomInt(0, pool.length-1);
                    idx = pool[poolIdx];

                    // Remove element from pool.
                    pool.splice(poolIdx, 1);

                    if (poolIdx === -1) {
                        console.log('AAAAAAA')
                    }

                    setIds[idx] = '';
                    globalSetIds[idx] = (globalSetIds[idx] || 0) + 1;
                    
                    // console.log('idx', idx, poolIdx);

                    item = J.clone(data[idx]);

                    if ('undefined' === typeof item) {
                        debugger
                    }

                    
                    delete item._id;
                    delete item._bsontype;
                    item.set = i;
                    item.pos = j;

                    set.push(item);

                    // Re-fill pool, but not with the inserted element.
                    if (!pool.length) {
                        pool = J.sample(0,(totItems-1));
                        reAdd2Pool = pool.splice(idx,1);
                        console.log(item.path);
                    }
                }


                // mdbWrite.store( { set : set } );
                
                // Test randomness. Save it to csv.
                
                node.fs.writeCsv('./sets_test.csv', set, {
                    writeHeaders: i === 0
                });
                // out.push(set);
                
                // console.log(i);
            }
            //            console.log(out.length);
            //            console.log(out[9].length);
            
            mdb.disconnect();
            mdbWrite.disconnect();
        });
        
    });
                
});


// function permute(input) {
//     var permArr = [],
//     usedChars = [];
//     function main(){
//         var i, ch;
//         for (i = 0; i < input.length; i++) {
//             ch = input.splice(i, 1)[0];
//             usedChars.push(ch);
//             if (input.length == 0) {
//                 permArr.push(usedChars.slice());
//             }
//             main();
//             input.splice(i, 0, ch);
//             usedChars.pop();
//         }
//         return permArr;
//     }
//     return main();
// }
// 
// permute(J.seq(0,100));