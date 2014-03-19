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
        var removed;

        var h, hLen;

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
                    pool = pool.concat(reAdd2Pool);
                    pool = J.shuffle(pool);
                    reAdd2Pool = undefined;
                }

                for ( ; ++j < PICS4SET ; ) {
                    poolIdx = J.randomInt(0, pool.length-1);
                    idx = pool[poolIdx];

                    // Remove element from pool.
                    removed = pool.splice(poolIdx, 1);

                    if (removed[0] !== idx) {
                        debugger;
                    }

                    if (poolIdx === -1) {
                        console.log('AAAAAAA')
                    }


                    globalSetIds[idx] = (globalSetIds[idx] || 0) + 1;
                    
                    if (setIds[idx]) {
                        debugger;
                    }
                    else {
                        setIds[idx] = idx;
                    }

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

                        // Var idx is in the correct order, so we can remove it.

                        pool = J.seq(0,(totItems-1));
                        reAdd2Pool = J.obj2Array(setIds);                        
                        reAdd2Pool.sort(function(a, b) {
                            return (a - b) //causes an array to be sorted numerically and ascending
                        });

                        h = -1, hLen = reAdd2Pool.length;
                        for ( ; ++h < hLen ; ) {
                            removed = pool.splice(reAdd2Pool[h]-h,1);
                            if (removed[0] !== reAdd2Pool[h]) {
                                debugger
                            }
                        }

                        // Shuffle it.
                        pool = J.shuffle(pool);
                        console.log(item.path);
                    }
                }

                // mdbWrite.store( { set : set } );
                
                // Test randomness. Save it to csv.                
                node.fs.writeCsv('./sets_test.csv', set, {
                    writeHeaders: i === 0
                });
                
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