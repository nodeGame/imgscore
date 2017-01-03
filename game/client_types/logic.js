/**
 * # Logic for Image Scoring
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * Handles incoming connections, sets the Face Categorization game
 * in each client, and start the game.
 * The state of each player is saved, and in case of disconnections and
 * reconnections the player restart from where it has left.
 * ---
 */

var path = require('path');
var J = require('JSUS').JSUS;
var ngc = require('nodegame-client');
var GameStage = ngc.GameStage;
var stepRules = ngc.stepRules;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var node = gameRoom.node;
    var channel = gameRoom.channel;

    // Default Step Rule.
    stager.setDefaultStepRule(stepRules.SOLO);

    // 1. Setting up database connection.

//     // Do not save in memory the data sent by clients.
//     node.off('in.set.DATA');
// 
//     // Establish the connection to database to load face sets.
//     var Database = require('nodegame-db').Database;
//     var ngdb = new Database(node);
//     var mdbLoad = ngdb.getLayer('MongoDB', {
//         dbName: 'facerank_db',
//         collectionName: 'facerank_sets_ordered'
//     });
// 
//     // Loads the sets of faces to send to players.
//     var sets, randomSets;
// 
//     mdbLoad.connect(function() {
//         var collection, db;
//         db = mdbLoad.getDbObj();
// 
//         // var COLLECTION_NAME = 'facecats_sets_random_full';
//         var COLLECTION_NAME = 'facecats_sets_less_rated_full';
// 
//         // Load GAME SETS.
//         var collection = db.collection(COLLECTION_NAME);
//         collection.find().toArray(function(err, data) {
//             console.log('data in facerank_sets_random_full: ', data.length);
//             console.log();
//             sets = data;
//             sets.sort();
// 
//             // Load SAMPLE SETS.
//             collection = db.collection('facecats_sets_random');
//             collection.find().toArray(function(err, data) {
//                 console.log('data in facerank_sets_random: ', data.length);
//                 console.log();
//                 randomSets = data;
//                 randomSets.sort();
//                 mdbLoad.disconnect();
//             });   
//         });
// 
//     });
// 
//     // Open the collection where the categories will be stored.
//     var mdbWrite = ngdb.getLayer('MongoDB', {
//         dbName: 'facerank_db',
//         collectionName: 'facescores'
//     });
// 
//     // Opening the database for writing.
//     mdbWrite.connect(function(){});

    // 2. Defining the single player game.

    // Every new connecting player will receive a new set of faces, indexed
    // by counter; also on(NEXT) a new set will be sent.
    var counter = settings.SET_COUNTER;
    var counterSample = settings.SAMPLE_SET_COUNTER;

//     // Loading the game to send to each connecting client.
//     // Second parameter makes available to the required file its properties.
//     var client = channel.require(__dirname + '/includes/game.client', {
//         Stager: node.Stager,
//         stepRules: node.stepRules,
//         settings: settings
//     });

    // State of all players.
    var gameState = {};

    // Sends the BONUS msg to the client.
    function goodbye(code) {        
        setTimeout(function() {
            // Send Win code;
            node.say('WIN', code.AccessCode, {
                win: settings.BONUS,
                exitcode: code.ExitCode
            });
        }, 200);
    }

    function checkAndCreateState(pId) {
        // Creating a state for reconnections.
        if (!gameState[pId]) {
            gameState[pId] = {
                randomSetId: null,
                // The set of pictures to evaluate.
                setId: null,
                // The length of the set (needed to know when to send
                // a new one).
                setLength: null,
                // Current picture of the set being categorized.
                pic: 0,
                // Flag: is player reconnecting.
                resume: false,
                // Counter: how many sets already completed.
                completedSets: 0,
                // User has just finished a set and will need a new one
                newSetNeeded: true
            };
        }
    }


    function startGameOnClient(pId) {
        
        checkAndCreateState(pId);

//         // Setting metadata, settings, and plot
//         node.remoteSetup('game_metadata',  pId, client.metadata);
//         node.remoteSetup('game_settings', pId, client.settings);
//         node.remoteSetup('plot', pId, client.plot);
//         node.remoteSetup('env', pId, client.env);

        // If players has been checked out already, just send him to
        // the last stage;
        if (gameState[pId].checkedOut) {           
            console.log('Player was already checkedOut ', pId);
            node.remoteCommand('start', pId, {
                startStage: new GameStage('2.1.2')
            });
            goodbye(dk.codes.id.get(pId));
            return;            
        }
        else {
            // Start the game on the client.
            node.remoteCommand('start', pId);
        }
    }

    // Functions.

    // Init Function. Will spawn everything.
    function init() {


        // This must be done manually for now (maybe change).
        node.on.mreconnect(function(p) {
            node.game.ml.add(p);
        });

        node.on.preconnect(function(p) {
            var p, code;
            
            console.log('One player reconnected ', p.id);

            pState = gameState[p.id];
            if (!p) {
                return;
            }
            if (!pState.disconnected) {
                // error
                throw new Error('Player was not disconnected ', p.id); 
            }
            
            // It is not added automatically.
            // TODO: add it automatically if we return TRUE? It must be done
            // both in the alias and the real event handler
            node.game.pl.add(p);
            
            pState.disconnected = false;

            // Player will continue from where he has left.
            gameState[p.id].resume = true;

        });

        // Sends the faces (reply to a GET request from client).
        node.on('NEXT', function(msg) {
            var set, state, secondSet;
            var code;

            console.log('***** Received NEXT ******');
            state = gameState[msg.from];
            
            if (state.newSetNeeded) {
                // Circular queue.
                state.setId = ++counter % sets.length;
                state.newSetNeeded = false;
                state.pic = 0;

                // There is actually a difference between setId and the set 
                // of the images actually evaluated. setId is the idx of the
                // array, but inside the array items are not ordered.
                mdbWrite.store({
                    rater: msg.from,
                    setId: state.setId,
                    randomSetId: state.randomSetId
                });
            }

            console.log(state);

            // We need to clone it, otherwise it gets overwritten.
            set = J.clone(sets[state.setId]);

            // This is a reconnection.
            if (state.resume) {
                node.remoteAlert('A previous unfinished game session has ' +
                                 'been detected. You will continue from ' +
                                 'the last image you saw.', msg.from);
                state.resume = false;


                // We slice to the last picture that has an evaluation
                // Since pictures are 1-based, we do not need to do -1.
                set.items = set.items.slice(state.pic);
            }
            // Player has rated 2 sets (about 60 paitings).
            else if (state.completedSets >= settings.NSETS) {
                state.checkedOut = true;
                code = dk.codes.id.get(msg.from);
                dk.checkOut(code.AccessCode, code.ExitCode, settings.BONUS);
                node.remoteCommand('step', msg.from);
                goodbye(code);
                return;
            }
            else {
                // The total number of pictures  must be set for the first time.
                state.setLength = set.items.length;
            }

            console.log('COUNTER ', counter);
            console.log('SET LENGTH ', set ? set.items.length : 'no set');
      
            return set;
        });

        // Client is requesting a random sample.
        node.on('sample', function(msg) {
            console.log('**** Received a get SAMPLE! ***');
            debugger
            checkAndCreateState(msg.from);
            if (gameState[msg.from].randomSetId === null) {
                gameState[msg.from].randomSetId = J.randomInt(0, randomSets.length);
            }
            return randomSets[gameState[msg.from].randomSetId].set;
        });

        // Client has categorized an image.
        node.on.data('score',function(msg) {
            var state;
            if (!msg.data) return;
            console.log('**** Received a CAT! ' + msg.data.round + '***');
            
            state = gameState[msg.from];
            console.log(state)

            // Add the setCounter in the received data.
            msg.data.setCounter = state.completedSets + 1;

            // Update the counter of the last categorized pic.
            state.pic = msg.data.pos + 1;
            if (state.pic === state.setLength) {
                ++state.completedSets;
                if (state.completedSets < settings.NSETS) {
                    state.newSetNeeded = true;
                }
            }           
            
            // Add the id of the rater to the item.
            msg.data.rater = msg.from;
            mdbWrite.store(msg.data);
        });
    }
    
    stager.setOnInit(init);


    return {
        nodename: 'imgscore',
        plot: stager.getState(),
        verbosity: 1,
        debug: true
    };

};
