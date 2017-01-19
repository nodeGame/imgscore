/**
 * # Logic for Image Scoring
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * The state of each player is saved, and in case of disconnections and
 * reconnections the player restart from where it has left.
 * ---
 */

var path = require('path');
var fs = require('fs');
var J = require('JSUS').JSUS;
var ngc = require('nodegame-client');
var NDDB = ngc.NDDB;
var GameStage = ngc.GameStage;
var stepRules = ngc.stepRules;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var node = gameRoom.node;
    var channel = gameRoom.channel;

    // Default Step Rule.
    stager.setDefaultStepRule(stepRules.SOLO);

    // 1. Setting up database connection.

    var gameDir, sets, randomSets, imgDb;

    gameDir = channel.getGameDir();

    sets = setup.sets;
    randomSets = setup.randomSets;
    imgDb = setup.imgDb;

    // Write bonus file headers.
    appendToBonusFile();

    // 2. Defining the single player game.

    // Every new connecting player will receive a new set of images, indexed
    // by counter; also on(NEXT) a new set will be sent.
    var counter = settings.SET_COUNTER;

    // State of all players.
    var gameState = {};

    // Size of the last memory dump (size always increasing).
    var lastDumpSize;

    // Dump db every X milliseconds (if there are changes).
    var dumpDbInterval;
    dumpDbInterval = 30000;

    // Functions.

    // Init Function. Will spawn everything.
    function init() {

        setInterval(function() {
            var s
            s = node.game.memory.size();
            if (s > 0 && s !== lastDumpSize) {
                lastDumpSize = s;
                node.game.memory.save('.db.json', function() {
                    fs.createReadStream(gameDir + 'data/.db.json')
                        .pipe(fs.createWriteStream(gameDir + 'data/db.json'));
                });
            }
        }, dumpDbInterval);

        node.game.sets = new NDDB();

        this.sampleStage = this.plot.normalizeGameStage('instructions.sample');

        // This must be done manually for now (maybe change).
        node.on.mreconnect(function(p) {
            node.game.ml.add(p);
        });

        node.on.preconnect(function(p) {
            var p, code;

            console.log('One player reconnected ', p.id);

            pState = gameState[p.id];

            if (!pState) {
                console.log('should not happen. no game state: ', p);
                return;
            }

            // Player will continue from where he has left.
            gameState[p.id].resume = true;
        });

        // Sends the images (reply to a GET request from client).
        node.on('get.NEXT', function(msg) {
            var set, origSet, state, secondSet;
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
                node.game.sets.insert({
                    rater: msg.from,
                    setId: state.setId,
                    randomSetId: state.randomSetId
                });
            }

            console.log(state);

            // Manual clone it, otherwise it might get overwritten (see below).
            origSet = sets[state.setId];
            set = {                
                set: origSet.set,
                items: origSet.items,
                completedSets: state.completedSets
            };

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
            // Player has rated all sets..
            else if (state.completedSets >= settings.NSETS) {
                state.checkedOut = true;
                code = channel.registry.getClient(msg.from);
                node.remoteCommand('step', msg.from, { breakStage: true });
                goodbye(code);
                return;
            }
            else {
                // The total number of pictures  must be set for the first time.
                state.setLength = set.items.length;
            }

            console.log('COUNTER ', counter);
            console.log('SET LENGTH ', set ? set.items.length : 'no set');
            console.log(set);
            return set;
        });

        // Client is requesting a random sample.
        node.on('get.sample', function(msg) {
            console.log('**** Received a get SAMPLE! ***');
            checkAndCreateState(msg.from);
            if (gameState[msg.from].randomSetId === null) {
                gameState[msg.from].randomSetId =
                    J.randomInt(0, randomSets.length) -1;
            }
            return randomSets[gameState[msg.from].randomSetId].items;
        });

        // Client has categorized an image.
        node.on.data('score',function(msg) {
            var state, metadata, obj;

            obj = msg.data;
            if (!obj) return;
            console.log('**** Received a CAT! ' + obj.id + '***');

            state = gameState[msg.from];
            console.log(state)

            // Add the setCounter in the received data.
            msg.data.setCounter = state.completedSets + 1;

            // Update the counter of the last categorized pic.
            state.pic++;
            if (state.pic === state.setLength) {
                state.completedSets++;
                if (state.completedSets < settings.NSETS) {
                    state.newSetNeeded = true;
                }
            }

            // Add the id of the rater to the item.
            obj.player = msg.from;
            obj.stage = msg.stage;

            metadata = imgDb.filename.get(msg.data.id);
            J.mixin(obj, metadata);

            // Insert in memory.
            node.game.memory.insert(obj);
        });

        // Save Email.
        node.on.data('email', function(msg) {
            var id, code;
            id = msg.from;

            code = channel.registry.getClient(id);
            if (!code) {
                console.log('ERROR: no code in endgame:', id);
                return;
            }

            // Write email.
            appendToEmailFile(msg.data, code);
        });
    }

    stager.setDefaultProperty('reconnect', function(p, opts) {
        // Reconnect back to 1.1.1 if disconnection happened in step 'sample'.
        if (GameStage.compare(p.disconnectedStage, this.sampleStage) === 0) {
            opts.targetStep = new GameStage('1.1.1');
        }
    });

    stager.setOnInit(init);

    return {
        nodename: 'imgscore',
        plot: stager.getState(),
        verbosity: 1
    };


    // ## Helper functions.

    // Sends the BONUS msg to the client.
    function goodbye(code) {
        var bonusStr, bonus;
        bonus = settings.BONUS;

        // Send Win code;
        node.say('WIN', code.AccessCode || code.id, {
            win: bonus,
            exitcode: code.ExitCode
        });

        // By default Approve is marked."
        bonusStr = '"' + (code.id || code.AccessCode || 'NA') + '","' +
            (code.ExitCode || code.id) + '","' +
            (code.WorkerId || 'NA') + '","' +
            (code.HITId || 'NA') + '","' +
            (code.AssignmentId || 'NA') + '",' +
            bonus + ',' + Number(bonus).toFixed(2) + ',"x",\n';
        appendToBonusFile(bonusStr);
    }

    // Adds a new entry into the gameState obj with player id and img set.
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

    /**
     * ### appendToBonusFile
     *
     * Appends a row to the bonus file (no checkings)
     *
     * @param {string} row Optional. The row to append, or undefined to add header
     */
    function appendToBonusFile(row) {
        if ('undefined' === typeof row) {
            row = '"access","exit","WorkerId","hid","AssignmentId","points",' +
                '"points.total","bonus","Approve","Reject"\n';
        }
        fs.appendFile(gameDir + 'data/bonus.csv', row, function(err) {
            if (err) {
                console.log(err);
                console.log(row);
            }
        });
    }

    /**
     * ### appendToEmail
     *
     * Appends a row to the email file (no checkings)
     *
     * @param {string} email The email
     * @param {object} code The client object from the registry
     */
    function appendToEmailFile(email, code) {
        var row;
        row  = '"' + (code.id || code.AccessCode || 'NA') + '", "' +
            (code.workerId || 'NA') + '", "' + email + '"\n';

        fs.appendFile(gameDir + 'data/email.csv', row, function(err) {
            if (err) {
                console.log(err);
                console.log(row);
            }
        });
    }

};