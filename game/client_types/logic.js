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
    var used = {};

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

    // 2. Sets variables.

    // Every new connecting player will receive a new set of images, indexed
    // by counter; also on(NEXT) a new set will be sent.
    var counter = settings.SET_COUNTER;

    // Sets that are not available given previously scored sets.
    // Increases as players rate new sets.
    // { id: { set1, set2, set3 ... } }
    var notAvailableSets = {};

    // Skipped sets are those that a player could not use,
    // because in conflict (containing images already used
    // in another sets). We try to give them to the NEXT request.
    var skippedSets = [];

    // 3. Game stuff.

    // State of all players.
    var gameState = {};

    // Size of the last memory dump (size always increasing).
    var lastDumpSize;

    // Dump db every X milliseconds (if there are changes).
    var dumpDbInterval;
    dumpDbInterval = 30000;


    var timeouts = {};
    var time4Set = 1800000;
    var time4Set = 10000;

    // Functions.

    // Init Function. Will spawn everything.
    function init() {

        // Saves time, id and worker id of connected clients (with timeout).
        var saveWhoConnected;
        var cacheToSave, timeOutSave;
        cacheToSave = [];
        saveWhoConnected = function(p) {

            cacheToSave.push(Date.now() + "," + p.id + "," +
                             (p.WorkerId || 'NA') + "," +
                             (p.userAgent ? '"' + p.userAgent + '"' : 'NA'));

            if (!timeOutSave) {
                timeOutSave = setTimeout(function() {
                    var txt;
                    txt = cacheToSave.join("\n") + "\n";
                    cacheToSave = [];
                    timeOutSave = null;
                    fs.appendFile(gameDir + 'data/codes.csv', txt,
                                  function(err) {
                                      if (err) {
                                          console.log(txt);
                                          console.log(err);
                                      }
                                  });
                }, dumpDbInterval);
            }
        }
        if (node.game.pl.size()) node.game.pl.each(saveWhoConnected);
        node.on.pconnect(saveWhoConnected);
        //////////////////////////////////


        // Save data with timeout.
        setInterval(function() {
            var s;
            s = node.game.memory.size();
            if (s > 0 && s !== lastDumpSize) {
                lastDumpSize = s;
                node.game.memory.save('.db.json', function() {
                    fs.createReadStream(gameDir + 'data/.db.json')
                        .pipe(fs.createWriteStream(gameDir + 'data/db.json'));
                });
            }
        }, dumpDbInterval);
        ///////////////////

        this.sampleStage = this.plot.normalizeGameStage('instructions.sample');

        // This must be done manually for now (maybe change).
        node.on.mreconnect(function(p) {
            node.game.ml.add(p);
        });

        node.on.preconnect(function(p) {
            var pState;

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
            var set, origSet, state, setId, oldSetId;

            console.log('***** Received NEXT ******');
            state = gameState[msg.from];

            if (state.newSetNeeded) {
                oldSetId = state.setId;
                // Mark the old set (if any) as completed.
                if ('number' === typeof oldSetId) {
                    sets[oldSetId].completed = true;
                    clearTimeout(timeouts[oldSetId]);
                    timeouts[oldSetId] = null;
                    console.log('set completed: ', oldSetId);
                }

                // Get new set id (will be equal to -1, if none is available).
                setId = getNextSetId(msg.from);

                if (setId === -1) {
                    state.noMoreCompatible = true
                    return { noMore: true };
                }

                state.setId = setId;
                state.newSetNeeded = false;
                state.pic = 0;

                // There is actually a difference between setId and the set
                // of the images actually evaluated. setId is the idx of the
                // array, but inside the array items are not ordered.
                node.game.memory.insert({
                    stage: node.player.stage,
                    player: msg.from,
                    setId: setId,
                    setCounter: (state.completedSets+1),
                    randomSetId: state.randomSetId
                });
            }

            // Manual clone it, otherwise it might get overwritten (see below).
            // Must be state.setId, because of If above.
            origSet = sets[state.setId];

            set = {
                set: origSet.set,
                items: origSet.items,
                completedSets: state.completedSets
            };

            // Start a timeout to complete a set, 
            // will become active again if expires.
            if (time4Set) {
                setId = state.setId;
                timeouts[setId] = setTimeout(function() {
                    if (timeouts[setId]) clearTimeout(timeouts[setId]);
                    // If old set was not completed, re-enabled it.
                    if (!sets[setId].completed) {
                        console.log('re-nabling set:' , setId);
                        skippedSets.push(setId);
                        used[setId] = false;
                        // TODO: Check if player is still connectected?
                        // If so disconnect it?
                    }
                }, time4Set);
            }

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
            else if (state.completedSets >= settings.SETS_MAX) {
                goodbye(msg.from);
                return;
            }
            else {
                // The total number of pictures  must be set for the first time.
                state.setLength = set.items.length;
            }

            // console.log('COUNTER ', counter);
            // console.log('SET LENGTH ', set ? set.items.length : 'no set');
            // console.log(set);
            return set;
        });

        // Client is requesting a random sample.
        node.on('get.sample', function(msg) {
            console.log('**** Get SAMPLE! ' + msg.from + ' ***');
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
            console.log('**** CAT! ' + obj.id + ' ' + msg.from + ' ***');

            state = gameState[msg.from];
            // console.log(state);

            // Add the setCounter in the received data.
            msg.data.setCounter = state.completedSets + 1;

            // Update the counter of the last categorized pic.
            state.pic++;
            if (state.pic === state.setLength) {
                state.completedSets++;
                if (state.completedSets < settings.SETS_MAX) {
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

        node.on.data('enoughSets', function(msg) {
            goodbye(msg.from);
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
        // Reconnect back to 1.1.1 if disconnection happened in instructions.
        if (p.disconnectedStage.stage === 1) {
            opts.targetStep = new GameStage('1.1.1');
        }
    });

    stager.setOnInit(init);

    return {
        nodename: 'imgscore',
        plot: stager.getState(),
        verbosity: setup.verbosity,
        debug: setup.debug
    };

    // ## Helper functions.

    /**
     * ### goodbye
     *
     * Advances a player to the next stage (the final) and sends the bonus
     *
     * @param {string} pId The id of the player
     */
    function goodbye(pId) {
        var bonusStr, bonus, bonusAndFee, code, state;

        state = gameState[pId];
        code = channel.registry.getClient(pId);

        // If TRUE, it is a reconnection.
        if (!state.checkedOut) {
            state.checkedOut = true;
            node.remoteCommand('step', pId, { breakStage: true });

            bonus = settings.BONUS * state.completedSets;
            bonusAndFee = settings.FEE + bonus;
            bonus = Number(bonus).toFixed(2);
            bonusAndFee = Number(bonusAndFee).toFixed(2);
            state.finalBonus = bonusAndFee;

            // Save record.

            // By default Approve is marked."
            bonusStr = '"' + (code.AccessCode || pId) + '","' +
                (code.ExitCode || 'NA') + '","' +
                (code.WorkerId || 'NA') + '","' +
                (code.HITId || 'NA') + '","' +
                (code.AssignmentId || 'NA') + '",' +
                bonus + ',"x",\n';
            appendToBonusFile(bonusStr);
        }

        // Send Win code;
        node.say('WIN', pId, {
            win: state.finalBonus,
            exitcode: code.ExitCode
        });
    }

    /**
     * ### checkAndCreateState
     *
     * Adds a new entry into the gameState obj with player id and img set
     *
     * @param {string} pId The id of the player
     */
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
     * @param {string} row Optional. The row to append, or undefined for header
     */
    function appendToBonusFile(row) {
        if ('undefined' === typeof row) {
            row = '"access","exit","WorkerId","hid","AssignmentId",' +
                '"bonus","Approve","Reject"\n';
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

    /**
     * ### Assigns sets to players taking into account already scored images
     *
     * @param {string} email The email
     *
     * @return {number} A position in the sets array, or -1
     *    if there are no more sets available.
     */
    function getNextSetId(pid) {
        var setId, moreLoops, skippedIdx, wasSkipped;
        moreLoops = true;
        skippedIdx = -1;
        while (moreLoops) {
            wasSkipped = false;
            // First try to re-use previously skipped sets by other players.
            if (skippedSets.length && ++skippedIdx < skippedSets.length) {
                setId = skippedSets[skippedIdx]
                wasSkipped = true;
            }
            // If none of the skipped sets are usable, try a new set.
            else {
                setId = ++counter;
                if (setId > (sets.length-1)) {
                    // All sets finished.
                    if (!skippedSets.length) {
                        // Mark the end.
                        fs.writeFile(gameDir + 'data/finished', 'ok',
                                     function(err) {
                                         if (err) {
                                             console.log(txt);
                                             console.log(err);
                                         }
                                     });
                    }
                    return -1;
                }
            }

            console.log('-0-0-0-0-0-');
            console.log(notAvailableSets[pid]);

            // Check if this set is usable.
            if (notAvailableSets[pid] && notAvailableSets[pid][setId]) {

                // If not, and if it was not already a skipped set,
                // add it to the list of skipped sets.
                if (!wasSkipped) skippedSets.push(setId);
            }
            else {
                // The set is good.
                moreLoops = false;
                // Other sets become unavailable to this participant.
                if (!notAvailableSets[pid]) notAvailableSets[pid] = {};
                J.mixin(notAvailableSets[pid], sets[setId].allIncompatibleSets);
                // If it was a skipped set, remove it from the list.
                if (wasSkipped) skippedSets.splice(skippedIdx, 1);
            }
        }

        console.log('NEXT ID: ', setId);
        if (used[setId]) throw new Error('WTF');
        used[setId] = true;
        // As it was before.
        return setId;
    }

};