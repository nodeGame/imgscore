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
    var setup = {};

    // This settings will be made available to all client types.
    // It is up to them to use them.

    setup.debug = true;
    setup.verbosity = 1;
    setup.window = {
        promptOnleave: !setup.debug
    };

    // We can also pre-load data (will be used by logic.js).
    // We load them here to save time, as compared to when
    // the game room is created for the first time.

    function loadRandomSets() {
        var db, filePath;
        filePath = gameDir + '/scripts/sets-of-images.json';
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

    setup.randomSets = loadRandomSets();
    setup.imgDb = loadImgDb();

    // Metadata. Taken from package.json. Can be overwritten.

    // setup.metadata = {
    //    name: 'another name',
    //    version: 'another version',
    //    description: 'another descr'
    // };

    return setup;
};
