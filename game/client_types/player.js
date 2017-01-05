/**
 * # Image scoring - Client
 * Copyright(c) 2016 Stefano Balietti
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
        this.faces = {};
        this.previousTags = {};
    });

    // STAGES and STEPS.

    function instructionsText() {
        var next, sampleDiv;
        console.log('instructions');

        W.setInnerHTML('nimages', node.game.settings.NIMAGES);

        sampleDiv = W.getElementById("sample");
        node.game.nextBtn = next = W.getElementById("doneButton");
        next.onclick = function() {
            this.disabled = "disabled";
            node.done();
        };

        // Preloading the sample
        node.get('sample', function(sample) {
            var i, len;
            var imgPath, img;
            // console.log(sample);

            i = -1, len = sample.length;
            for (; ++i < len;) {
                imgPath = sample[i];
                img = document.createElement('img');
                img.src = '/imgscore/faces/' + imgPath;
                img.className = 'imgSample';
                sampleDiv.appendChild(img);
            }
        });
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

    function facerank() {
        console.log('facerank');

        var sliders;
        var next, faceImg;
        var $;
        var order;
        var evaTD, evaFace, evaAbstract, evaOverall, evaCreativity;
        var help, helpLink;
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
            $( "#eva_" + slName ).val( $( "#slider_" + slName ).slider( "value" ) );
        }

        function displayFace() {
            var imgPath;
            var i, len;

            imgPath = node.game.faces.items[++node.game.counter];
            faceImg.src = 'faces/' + imgPath;
            next.disabled = false;
            node.timer.setTimestamp('newpic_displayed');

            node.game.evaHasChanged = false;

            order = JSUS.shuffleElements(evaTD, JSUS.sample(0,3));

            i = -1, len = sliders.length;
            for ( ; ++i < len ; ) {
                buildSlider(sliders[i]);
            }

        }

        function onNextFaces(faces) {
            console.log('******* AAH! received NEXT from server');
            if ('object' !== typeof faces) {
                console.log('**** Weird: wrong faces! ');
                return;
            }
            else {
                console.log(faces);
            }

            node.game.counter = -1;
            node.game.faces = faces;

            displayFace();
        }

        function askForNext() {
            var faces, obj, counter;
            var face;
            var time2score;
            var scoreOverall, scoreCreativity, scoreFace, scoreAbstract;

            time2score = node.timer.getTimeSince('newpic_displayed');
            next.disabled = true;
            counter = node.game.counter;
            faces = node.game.faces;
            scoreOverall = evaOverall.value;
            scoreCreativity = evaCreativity.value;
            scoreFace = evaFace.value;
            scoreAbstract = evaAbstract.value;

            if (counter !== -1 && counter < faces.items.length) {

                face = faces.items[counter];

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

            if (!faces.items || counter >= (faces.items.length -1)) {
                node.get('NEXT', onNextFaces);
            }
            else {
                displayFace();
            }
        }

        // Help.

        node.on('help', function() {
            if (help.style.display === 'none') {
                help.style.display = '';
                helpLink.innerHTML = 'Hide help';
            }
            else {
                help.style.display = 'none';
                helpLink.innerHTML = 'Show help';
            }
        });

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

        // Help.
        help = W.getElementById('helpSpan');
        helpLink = W.getElementById('helpLink');

        // Click!
        next.onclick = askForNext;
        next.click();
    }

    function thankyou() {
        console.log('thank you.');

        node.on.data('WIN', function(msg) {
            var win, exitcode, codeErr;
            codeErr = 'ERROR (code not found)';
            win = msg.data && msg.data.win || 0;
            exitcode = msg.data && msg.data.exitcode || codeErr;
            W.writeln('Your bonus in this game is: ' + win);
            W.writeln('Your exitcode is: ' + exitcode);
        });
    }

    // Creating stages and steps
    
    // TODO: At this point, stages must be defined (also steps)
    // in game.stages. This is quite annoying in the case where
    // the logic does not follow the same structure as the client.

    stager.extendStep('instructionsText', {
        cb: instructionsText,
        frame: 'instructions.htm'
    });

    stager.extendStep('sample', {
        cb: sample
    });

    stager.extendStep('facerank', {
        cb: facerank,
        frame: 'facepage.htm'
    });

    stager.extendStep('thankyou', {
        cb: thankyou,
        frame: 'thankyou.htm'
    });

    game.plot = stager.getState();
    game.verbosity = 1000;

    return game;
};