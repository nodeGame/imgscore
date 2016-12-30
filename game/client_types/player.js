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
        var header, frame;
        console.log('** INIT PLAYER! **');
        
        header = W.generateHeader();
        frame = W.generateFrame();
        W.setHeaderPosition('top');

        this.counter = -1;
        this.faces = {};
        this.previousTags = {};
    });

    // STAGES and STEPS.

    function facerank() {
        console.log('facerank');

        var sliders;
        var next, faceImg, td;
        var sl, $;
        var order;

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

            imgPath = node.game.faces.items[++node.game.counter].path;
            faceImg.src = '/facerank/faces/' + imgPath;
            next.disabled = false;
            node.timer.setTimestamp('newpic_displayed');

            node.game.evaHasChanged = false;

            order = JSUS.shuffleNodes(evaTD, JSUS.sample(0,3));

            i = -1, len = sliders.length;
            for ( ; ++i < len ; ) {
                buildSlider(sliders[i]);
            }

            //AUTOPLAY
            node.env('auto', function(){
                node.timer.randomExec(function() {

                    $( "#slider_overall" ).slider( "value",  Math.random()*10);
                    $( "#eva_overall" ).val( $( "#slider_overall" ).slider( "value" ) );

                    $( "#slider_creativity" ).slider( "value",  Math.random()*10);
                    $( "#eva_creativity" ).val( $( "#slider_creativity" ).slider( "value" ) );

                    $( "#slider_face" ).slider( "value",  Math.random()*10);
                    $( "#eva_face" ).val( $( "#slider_face" ).slider( "value" ) );

                    $( "#slider_abstract" ).slider( "value",  Math.random()*10);
                    $( "#eva_abstract" ).val( $( "#slider_abstract" ).slider( "value" ) );

                    next.click();

                }, 4000);
            });

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
            var score, faces, obj, i, len, secondSet, counter;
            var face;
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
                    session: face.id,
                    player: face.player,
                    round: face.round,
                    morn: face.morn,
                    path: face.path,
                    set: face.set,
                    pos: face.pos,
                    scoreOverall: scoreOverall,
                    scoreCreativity: scoreCreativity,
                    scoreFace: scoreFace,
                    scoreAbstract: scoreAbstract,
                    hasChanged: node.game.evaHasChanged,
                    order: order,
                    time2score: time2score

                };
                node.set('score', obj);
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
        next = W.getElementById("doneButton");

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
    };

    function instructionsText() {
        var next, sampleDiv;
        console.log('instructions');

        sampleDiv = W.getElementById("sample");
        next = W.getElementById("doneButton");
        next.onclick = function() {
            this.disabled = "disabled";
            node.emit('DONE');
        };

        // Preloading the sample
        node.get('sample', function(sample) {
            var i = -1, len = sample.length;
            var imgPath, img;
            // console.log(sample);
            for(; ++i < len;){
                imgPath = sample[i];
                img = document.createElement('img');
                img.src = '/imgscore/faces/' + imgPath;
                img.className = 'imgSample';
                sampleDiv.appendChild(img);
            }

            node.env('auto', function() {
                node.timer.randomExec(function() {
                    next.click();
                }, 2000);
            });
        });
    }

    function sample() {
        var sampleDiv, instructions, next;
        var doneTimer, doneTimerSpan;

        console.log('*** sample ! ***');

        next = W.getElementById("doneButton");
        instructions = W.getElementById("instructions");
        sampleDiv = W.getElementById("sample");
        instructions.style.display = 'none';
        sampleDiv.style.display = '';
        doneTimerSpan = W.getElementById("doneTimer");

        doneTimer = node.widgets.append('VisualTimer', doneTimerSpan, {
            milliseconds: 90000,
            update: 1000,
            name: 'candonext',
            listeners: false,
            timeup: function() {
                next.disabled = false;
            }
        });

        node.env('auto', function() {
            node.timer.randomExec(function() {
                doneTimer.stop();
                next.disabled = false;
                next.click();
            }, 2000);
        });
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
}