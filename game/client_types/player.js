/**
 * # Image scoring - Client
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * Receives links to images and goes through them displaying rating sliders.
 * ---
 */

var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var constants = ngc.constants;

// Export the game-creating function. It needs the name of the treatment and
// its options.
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game;
    game = {};

    // Default Step Rule.
    stager.setDefaultStepRule(stepRules.SOLO);

    // INIT and GAMEOVER.

    stager.setOnInit(function() {
        var frame;
        console.log('** INIT PLAYER! **');

        frame = W.generateFrame();

        // How many images scored in this set.
        this.counter = -1;

        // Contains data about the images to display, and sets completed.
        this.images = {};

        // Automatically stops from asking the next set of images to rate
        // (the server would not send them anyway).
        this.nSetsLimit = this.settings.NSETS -1;

        // If TRUE, the loop at imgscore is broken.
        this.enoughSets = false;

        this.getSample = function() {
            var that, sampleDiv;
            that = this;
            sampleDiv = W.getElementById('sample');
            // Preloading the sample
            node.get('sample', function(sample) {
                var i, len;
                var imgPath, img;
                var $;

                // jQuery.
                $ = W.getFrameWindow().$;

                that.sample = sample;
                i = -1, len = sample.length;
                for (; ++i < len;) {
                    imgPath = sample[i];
                    img = document.createElement('img');
                    img.src = node.game.settings.IMG_DIR + imgPath;
                    img.className = 'imgSample';

                    sampleDiv.appendChild(img);

                    (function(img) {
                        var tooltip;
                        tooltip = $('<img src="' + img.src + '" />"');

                        $(img).hover(
                            function(e) {
                                tooltip.addClass('tooltip');
                                tooltip.css({
                                    "left": (5 + e.pageX) + "px",
                                    "top": -200 + e.pageY + "px"
                                });
                                $(this).before(tooltip);

                            },
                            function() {
                                $(tooltip).remove();
                            }
                        );
                    })(img);
                }
            });
        };

        node.on('SOCKET_DISCONNECT', function() {
            W.clearPage();
            document.title = 'disconnected';
            W.writeln('Disconnection detected. Please reconnect to ' +
                      'resume the task from where you have left.');
        });
    });

    // STAGES and STEPS.

    function instructionsText() {
        var next, s;
        console.log('instructions');
        s = node.game.settings;
        W.setInnerHTML('nimages', s.NIMAGES);
        W.setInnerHTML('sets_lowbound', s.SETS_MIN);
        if (s.SETS_MIN !== 1) W.setInnerHTML('set_plural', 'sets');
        W.setInnerHTML('sets_highbound', s.SETS_MAX);

        node.game.nextBtn = next = W.getElementById("doneButton");
        next.onclick = function() {
            this.disabled = "disabled";
            node.done();
        };

        // Require sample images.
        this.getSample();
    }

    function instructionsText2() {
        var s, ul, li;
        var i, len;

        console.log('instructions2');
        
        W.hide('instructions');
        W.show("instructions2");

        s = node.game.settings.SCORE_OPTIONS;
        W.setInnerHTML('grade_lowest', s.choices[0]);
        W.setInnerHTML('grade_highest', s.choices[(s.choices.length-1)]);

        ul = W.getElementById('dimensions_list');
        i = -1, len = s.items.length;
        for ( ; ++i < len ; ) {
            li = document.createElement('li');
            li.innerHTML = s.items[i];
            ul.appendChild(li);
        }

        W.getElementById("doneButton").disabled = false;
    }

    function sample() {
        var next, doneTimerSpan;

        console.log('*** sample ! ***');

        W.hide('instructions2');
        W.show("sample");
        
        next = W.getElementById("doneButton");
        doneTimerSpan = W.getElementById("doneTimer");

        node.game.doneTimer =
            node.widgets.append('VisualTimer', doneTimerSpan, {
                milliseconds: 30000,
                name: 'candonext',
                listeners: false,
                timeup: function() {
                    next.disabled = false;
                }
            });

        node.game.doneTimer.start();
    }

    function imgscore() {
        console.log('imgscore');

        var next, mainImg;
        var ctgOptions, ctgRoot;
        var i, len, items;

        if (!node.game.score) {

            ctgRoot = W.getElementById('td_score');
            ctgOptions = node.game.settings.SCORE_OPTIONS;
            if (!ctgOptions.id) ctgOptions.id = 'score';
            if (!ctgOptions.title) ctgOptions.title = false;

            i = -1, len = ctgOptions.items.length;
            items = new Array(len);
//             for ( ; ++i < len ; ) {
//                 items[i] = {
//                     id: ctgOptions.items[i],
//                     choices: ctgOptions.choices,
//                     left: '<span class="dimension">' + 
//                         ctgOptions.items[i] + ':</span> ' + ctgOptions.left,
//                     right: ctgOptions.right
//                 };
//             }
            for ( ; ++i < len ; ) {
                items[i] = {
                    id: ctgOptions.items[i],
                    choices: ctgOptions.choices,
                    left: '<span class="dimension">' + 
                        ctgOptions.items[i] + ':</span> '
                };
            }
            ctgOptions.items = items;
            ctgOptions.orientation = 'H';
           
            node.game.score = node.widgets.append('ChoiceTableGroup', ctgRoot,
                                                  ctgOptions);
        }

        W.show('image_table');
        W.hide('continue');

        function displayImage() {
            var imgPath;
            imgPath = node.game.images.items[++node.game.counter];
            mainImg.src = node.game.settings.IMG_DIR + imgPath;
            next.disabled = false;
            node.timer.setTimestamp('newpic_displayed');
        }

        function onNextImages(images) {
            if ('object' !== typeof images) {
                console.log('**** Weird: wrong images! ');
                return;
            }
            node.game.counter = -1;
            node.game.images = images;
            displayImage();
        }

        function askForNext() {
            var images, obj, counter;
            var img, time2score;

            time2score = node.timer.getTimeSince('newpic_displayed');
            next.disabled = true;
            counter = node.game.counter;
            images = node.game.images;

            if (counter !== -1 && counter < images.items.length) {
                obj = node.game.score.getValues({ 
                    reset: { shuffleItems: true }
                });
                if (obj.missValues) {
                    next.disabled = false;
                    return;
                }

                next.innerHTML = 'Next (' + (counter + 1) + '/' +
                    node.game.settings.NIMAGES + ')';

                // Path to the image, used as id.
                img = images.items[counter];
                obj.id = img;

                node.say('score', 'SERVER', obj);
            }

            // Ask the server for the next set of images.
            if (!images.items) {
                node.get('NEXT', onNextImages);
            }
            else if (counter >= (images.items.length -1)) {
                W.hide('image_table');
                node.done();                
            }
            else {
                displayImage();
            }
        }

        // Elements of the page.

        // Next button.
        node.game.nextBtn = next = W.getElementById("doneButton");

        // Img.
        mainImg = W.getElementById('image');


        // Click!
        next.disabled = false;
        next.innerHTML = 'Next';
        next.onclick = askForNext;
        next.click();
    }

    function continueCb() {
        var remainingSets;
        W.hide('image_table');
        remainingSets = this.settings.SETS_MAX - (this.images.completedSets+1);
        W.setInnerHTML('remaining', remainingSets);
        // All sets scored.
        if (this.images.completedSets >= this.nSetsLimit) {
            W.show('end');
            W.getElementById('endButton').onclick = function() {
                // Triggers to go to next stage.
                node.get('NEXT', function() {});
            };
        }
        // Display option to continue.
        else {
            W.show('continue');
            
            W.getElementById('yes').onclick = function() {
                // Need to update both.
                node.game.counter = -1;
                node.game.images = {};
                node.done();
            };
            W.getElementById('no').onclick = function() {
                node.game.enoughSets = true;
                node.done();
            };
        }
    }

    function thankyou() {
        var b, i, errStr, counter;
        console.log('thank you.');

        node.on.data('WIN', function(msg) {
            var win, exitcode, codeErr;
            var exitCodeInput, winInput;
            var winUsd;
            // Exit Code.
            codeErr = 'ERROR (code not found)';
            exitcode = msg.data && msg.data.exitcode || codeErr;
            exitCodeInput = W.getElementById('exitCode');
            exitCodeInput.value = exitcode;

            // Total win.
            win = msg.data && msg.data.win || 0;
            winInput = W.getElementById('win');
            winUsd = win / node.game.settings.EXCHANGE_RATE;
            winInput.value = win +
                ' Points = ' + Number(winUsd).toFixed(2) + ' USD';
        });

        // Email box.
        counter = 0;
        b = W.getElementById('submit-email');
        i = W.getElementById('email');
        errStr = 'Check your email and click here again';
        b.onclick = function() {
            var email, indexAt, indexDot;
            email = i.value;
            if (email.trim().length > 5) {
                indexAt = email.indexOf('@');
                if (indexAt !== -1 &&
                    indexAt !== 0 &&
                    indexAt !== (email.length-1)) {
                    indexDot = email.lastIndexOf('.');
                    if (indexDot !== -1 &&
                        indexDot !== (email.length-1) &&
                        indexDot > (indexAt+1)) {

                        b.disabled = true;
                        i.disabled = true;
                        node.say('email', 'SERVER', email);
                        b.onclick = null;
                        b.innerHTML = 'Sent!';
                        return;
                    }
                }
            }
            b.innerHTML = errStr;
            if (counter) b.innerHTML += '(' + counter + ')';
            counter++;
        };
        // Remove block from leaving page.
        W.restoreOnleave();
    }

    // Creating stages and steps

    // TODO: At this point, stages must be defined (also steps)
    // in game.stages. This is quite annoying in the case where
    // the logic does not follow the same structure as the client.

    // Instructions.
    stager.extendStage('instructions', {
        frame: 'instructions.htm'
    });
    stager.extendStep('text', {
        cb: instructionsText
    });
    stager.extendStep('text2', {
        cb: instructionsText2
    });
    stager.extendStep('sample', {
        cb: sample
    });

    // Scoring.
    stager.extendStage('imgscore', {
        frame: 'scorepage.htm'
    });
    stager.extendStep('imgscore', {
        cb: imgscore
    });
    stager.extendStep('continue', {
        cb: continueCb
    });

    // Thank you.
    stager.extendStep('thankyou', {
        cb: thankyou,
        frame: 'thankyou.htm'
    });

    game.plot = stager.getState();
    game.verbosity = 1000;

    return game;
};