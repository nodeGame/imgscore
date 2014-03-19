/**
 * # Game settings for Face Categorization  game.
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // Waiting Room Settings. *
    ////////////////////////////
    
    // How many sessions should be dispatched.
    TARGET_SESSIONS: 1,

    // Stop creating new sessions after N sessions has been dispatched.
    ACCEPT_EXTRA_SESSIONS: false,

    // Session Counter start from.
    SESSION_ID: 100,

    // Number of sets of pictures to rate per player.
    NSETS: 1,

    // Serve sets of images sequentally from set X (it is zero-indexed).
    SET_COUNTER: 0,

    // Serve random samples of images sequentially from sample X.
    SAMPLE_SET_COUNTER: 0,

    // Payment settings. *

    // Divider ECU / DOLLARS *
    BONUS: 0.5,

    // DEBUG.
    DEBUG: false,

    // AUTO-PLAY.
    AUTO: false,

    // DATABASE.
    DB: 'FILE', // FILE, MONGODB

    // AUTHORIZATION.
    AUTH: 'NO' // MTURK, LOCAL, NO.

    // * = if you change this you need to update instructions and quiz
};
