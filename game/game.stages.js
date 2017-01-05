/**
 * # Game stages definition file
 * Copyright(c) 2016 Stefano Balietti <s.balietti@neu.edu>
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
        .next('imgscore')
        .next('thankyou')
        .gameover();

    stager.extendStage('instructions', {
        steps: [ 'text', 'sample' ]
    });
 
    return stager.getState();
};
