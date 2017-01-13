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
       
        this.counter = -1;
        this.images = {};
        this.previousTags = {};


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

                    // img['data-toggle'] = 'tooltip';
                    // img.title = '<img src="' + img.src + '" />"';

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
        var next;
        console.log('instructions');

        W.setInnerHTML('nimages', node.game.settings.NIMAGES);

        node.game.nextBtn = next = W.getElementById("doneButton");
        next.onclick = function() {
            this.disabled = "disabled";
            node.done();
        };

        // Require sample images.
        this.getSample();
    }

    function sample() {
        var sampleDiv, instructions, next;
        var doneTimerSpan;

        console.log('*** sample ! ***');

        next = W.getElementById("doneButton");
        instructions = W.getElementById("instructions");
        sampleDiv = W.getElementById("sample");
        instructions.style.display = 'none';
        sampleDiv.style.display = '';
        doneTimerSpan = W.getElementById("doneTimer");

        node.game.doneTimer = 
            node.widgets.append('VisualTimer', doneTimerSpan, {
                milliseconds: 2000,
                update: 1000,
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

        var sliders;
        var next, faceImg;
        var $;
        var order;
        var evaTD, evaFace, evaAbstract, evaOverall, evaCreativity;

        var slOverall, slCreativity, slFace, slAbstract;

        sliders = [ 'overall', 'creativity', 'face', 'abstract' ];
        
        function buildSlider(slName) {
            $( "#slider_" + slName).slider({
                value: 5,
                min: 0,
                max: 10,
                step: 0.1,
                slide: function( event, ui ) {
                    $( "#eva_" + slName ).val( ui.value );
                    node.game.evaHasChanged = true;
                }
            });
            $("#eva_" + slName).val($("#slider_" + slName ).slider("value"));
        }

        function displayImage() {
            var imgPath;
            var i, len;

            imgPath = node.game.images.items[++node.game.counter];
            faceImg.src = node.game.settings.IMG_DIR + imgPath;
            next.disabled = false;
            node.timer.setTimestamp('newpic_displayed');

            node.game.evaHasChanged = false;

            order = JSUS.shuffleElements(evaTD, JSUS.sample(0,3));

            i = -1, len = sliders.length;
            for ( ; ++i < len ; ) {
                buildSlider(sliders[i]);
            }

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
            var face;
            var time2score;
            var scoreOverall, scoreCreativity, scoreFace, scoreAbstract;

            time2score = node.timer.getTimeSince('newpic_displayed');
            next.disabled = true;
            counter = node.game.counter;
            images = node.game.images;
            scoreOverall = evaOverall.value;
            scoreCreativity = evaCreativity.value;
            scoreFace = evaFace.value;
            scoreAbstract = evaAbstract.value;

            if (counter !== -1 && counter < images.items.length) {

                face = images.items[counter];

                obj = {
                    id: face,
                    scoreOverall: scoreOverall,
                    scoreCreativity: scoreCreativity,
                    scoreFace: scoreFace,
                    scoreAbstract: scoreAbstract,
                    hasChanged: node.game.evaHasChanged,
                    order: order,
                    time2score: time2score
                };
                node.say('score', 'SERVER', obj);
            }

            if (!images.items || counter >= (images.items.length -1)) {
                node.get('NEXT', onNextImages);
            }
            else {
                displayImage();
            }
        }

        // Elements of the page.

        // jQuery.
        $ = W.getFrameWindow().$;

        // Next button.
        node.game.nextBtn = next = W.getElementById("doneButton");

        // Img.
        faceImg = W.getElementById('face');

        // TD with all the sliders
        evaTD = W.getElementById('evaTd');

        // Slider.
        slOverall = W.getElementById('slider_overall');
        slCreativity = W.getElementById('slider_creativity');
        slFace = W.getElementById('slider_face');
        slAbstract = W.getElementById('slider_abstract');

        // Disabled input with score.
        evaOverall = W.getElementById('eva_overall');
        evaCreativity = W.getElementById('eva_creativity');
        evaFace = W.getElementById('eva_face');
        evaAbstract = W.getElementById('eva_abstract');

        // Click!
        next.onclick = askForNext;
        next.click();
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

    stager.extendStep('text', {
        cb: instructionsText,
        frame: 'instructions.htm'
    });

    stager.extendStep('sample', {
        cb: sample
    });

    stager.extendStep('imgscore', {
        cb: imgscore,
        frame: 'scorepage.htm'
    });

    stager.extendStep('thankyou', {
        cb: thankyou,
        frame: 'thankyou.htm'
    });

    game.plot = stager.getState();
    game.verbosity = 1000;

    return game;
};