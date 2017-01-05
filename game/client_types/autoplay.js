/**
 * # Phantom type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

 var ngc = require('nodegame-client');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;

    var game, stager;

    game = gameRoom.getClientType('player');
    game.nodename = 'autoplay';

    stager = ngc.getStager(game.plot);

    stager.extendAllSteps(function(o) {
        o._cb = o.cb;
        o.cb = function() {
            var _cb, stepObj, id;
            var i, len, delay;

            stepObj = this.getCurrentStepObj();
            // Invoking original callback.
            _cb = stepObj._cb;
            _cb.call(this);

            id = stepObj.id

            // TODO: Adapt to specific steps.
            if (id === 'instructionsText') {
                
                node.timer.randomExec(function() {
                    node.game.nextBtn.click();
                }, 2000);
                
            }

            if (id === 'sample') {

                node.on.data('sample', function() {                    
                    node.timer.randomExec(function() {
                        node.game.nextBtn.click();
                    }, 2000);
                });

            }
            else if (id === 'facerank') {
                delay = 2000;
                i = -1, len = node.game.settings.NIMAGES;
                for ( ; ++i < len ; ) {                    
                    node.timer.randomExec(function() {
                        var $;
                        $ = W.getFrameWindow().$;
                        $( "#slider_overall" ).slider( "value",  Math.random()*10);
                        $( "#eva_overall" ).val( $( "#slider_overall" ).slider( "value" ) );

                        $( "#slider_creativity" ).slider( "value",  Math.random()*10);
                        $( "#eva_creativity" ).val( $( "#slider_creativity" ).slider( "value" ) );

                        $( "#slider_face" ).slider( "value",  Math.random()*10);
                        $( "#eva_face" ).val( $( "#slider_face" ).slider( "value" ) );

                        $( "#slider_abstract" ).slider( "value",  Math.random()*10);
                        $( "#eva_abstract" ).val( $( "#slider_abstract" ).slider( "value" ) );

                        node.game.nextBtn.click();

                    }, delay);
                    delay = delay + 2000;
                }

            }
            else if (id === 'thankyou') {
                // Nothing to do here.
                W.getElementById('email').value =
                    node.JSUS.randomString(9, 'a') + '@' + 'a.com';
                W.getElementById('submit-email').click();
                node.timer.randomExec(function() {
                    // Kill phantoms in test mode.
                    console.log('PHANTOMJS EXITING');
                });
                
            }
            else {
              node.timer.randomDone(2000);
            }
        };
        return o;
    });

    game.plot = stager.getState();

    return game;
};
