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

            if (id === 'sample') {
                node.timer.randomDone(10000);
            }

            else if (id === 'continue') {
                node.timer.randomExec(function() {
                    if (Math.random() > 0.65) W.getElementById('no').click();
                    else W.getElementById('yes').click();
                }, 3000);
            }
            else if (id === 'imgscore') {
                delay = 2000;
                i = -1, len = node.game.settings.NIMAGES;
                for ( ; ++i < len ; ) {
                    node.timer.setTimeout(function() {
                        // because setValues is buggy.
                        // if (node.player.stage.step === 2) return;
                        node.game.score.setValues();
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
