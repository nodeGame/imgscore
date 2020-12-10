/**
 * # Game stages definition file
 * Copyright(c) 2017 Stefano Balietti <s.balietti@neu.edu>
 * MIT Licensed
 *
 * Stages are defined using the stager API
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(stager, settings) {

    // No stages.
    // Stages are defined inside the client types.

    stager
        .next('instructions')
        .loop('imgscore', function() {
            return !this.enoughSets;
        })
        .next('thankyou')
        .gameover();

    stager.extendStage('instructions', {
        steps: [ 'text', 'text2', 'sample' ]
    });

    stager.extendStage('imgscore', {
        steps: [ 'imgscore', 'continue' ]
    });

    // Cannot be skipped, because it loads the images.
    // stager.skip('instructions');

    return stager.getState();
};
