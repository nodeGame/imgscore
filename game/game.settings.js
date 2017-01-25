/**
 * # Game settings for Images Scoring game.
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

var ratingScale = [ 1, 2, 3, 4, 5, 6, 7 ];

module.exports = {

    // Session Counter start from (not used).
    SESSION_ID: 100,

    // Number of sets of pictures to rate per player.
    SETS_MIN: 1,

    // Number of sets of pictures to rate per player.
    SETS_MAX: 5,

    // Number of images per set.
    NIMAGES: 20,

    // Number of images per set.
    SKIPSETS: true,

    // Options to pass to the ChoiceTableGroup widget
    // for creating the scoring interface.
    SCORE_OPTIONS: {

        mainText: '<h4><strong>Score the image above on a scale from ' +
            ratingScale[0] + ' (lowest) to ' +
            ratingScale[(ratingScale.length-1)] + 
            ' (highest).</strong></h4>' +
            'Try to consider the value of the image ' +
            '<strong>relative</strong> to the others you have ' +
            'observed in the sample.<br/>',

        items: [
            'Overall Appeal or Quality',
            'Creativity',
            'Interestingness as a Face',
            'Abstractness'
        ],

        choices: ratingScale,

        shuffleItems: true, 

        requiredChoice: true,

        left: 'Lowest',

        right: 'Highest',
    },

    // Serve sets of images sequentally from set X (it is zero-indexed).
    SET_COUNTER: -1,

    // The name of the folder in public/ containing the images.
    // Keep the trailing slash.
    IMG_DIR: 'imgscore/',

    // Payment settings.

    // Divider ECU / DOLLARS *
    BONUS: 1,

    EXCHANGE_RATE: 1
};
