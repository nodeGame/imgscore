/**
 * # Game setup
 * Copyright(c) 2017 Stefano Balietti s.balietti@neu.edu
 * MIT Licensed
 *
 * The file includes settings for the nodeGame client instance
 *
 * http://www.nodegame.org
 * ---
 */

var NDDB = require('nodegame-client').NDDB;

module.exports = function(settings, stages, gameDir, level) {
    var setup, tmp;
    setup = {};

    // This settings will be made available to all client types.
    // It is up to them to use them.

    setup.debug = false;
    setup.verbosity = 0;
    setup.window = { 
        promptOnleave: !setup.debug,
        disableBackButton: !setup.debug        
    };

    // We can also pre-load data (will be used by logic.js).
    // We load them here to save time, as compared to when
    // the game room is created for the first time.

    function loadSets(file) {
        var db, filePath;
        filePath = gameDir + '/scripts/' + file;
        db = new NDDB();
        db.loadSync(filePath);
        db.sort(function(a, b) {
            if (a.set < b.set) return -1
            if (b.set < a.set) return 1;
            throw new Error('Cannot have same set id!');
        });
        return db.db;
    }

    function loadImgDb() {
        var db, filePath;
        filePath = gameDir + '/scripts/all-images-db.json';
        db = new NDDB({ update: { indexes: true } });
        db.index('filename');
        db.loadSync(filePath);
        return db;
    }

    // Sets of 20 images (-extra contains info about incompatible sets).
    setup.sets = loadSets('sets-of-images-final-extra-MAY04_LAST2SETS.json');

    // Optional. Restrict sets.
    // tmp = [ setup.sets[73], setup.sets[7], setup.sets[53],
    //         setup.sets[56], setup.sets[72],
    //         setup.sets[74], setup.sets[0] ]
    // setup.sets = tmp;

    // Sets of 40 images each.
    setup.randomSets = loadSets('sets-of-images-40.json');
    // All images paths, etc.
    setup.imgDb = loadImgDb();

    return setup;
};
