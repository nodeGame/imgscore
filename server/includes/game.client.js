/**
 * # Face ranking game - Client
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Client receives links of images and it goes through them
 * displaying a rating bar.
 * ---
 */
var Stager = module.parent.exports.Stager;
var stepRules = module.parent.exports.stepRules;
var settings = module.parent.exports.settings;

var stager = new Stager();

var game = {};

module.exports = game;

// GLOBALS

game.globals = {};

// INIT and GAMEOVER

stager.setOnInit(function() {
    console.log('** INIT PLAYER! **');
    W.setupFrame('SOLO_PLAYER');
    this.counter = -1;
    this.faces = {};
    this.previousTags = {};
});

///// STAGES and STEPS

function facerank() {
    console.log('facerank');

    var sliders = ['overall', 'creativity', 'face', 'abstract'];

    W.loadFrame('/facerank/html/facepage.htm', function() {
        var next, faceImg, td;
        var sl, $;
        var order;

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
//                node.timer.randomExec(function() {
//                    $( "#slider" ).slider( "value",  Math.random()*10);
//                    $( "#eva" ).val( $( "#slider" ).slider( "value" ) );
//                }, 2000);
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
    });
    return true;
};

function instructionsText() {
    console.log('instructions');
    W.loadFrame('/facerank/html/instructions.htm', function() {
        var next, sampleDiv;
        
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
                img.src = '/facerank/faces/' + imgPath;
                img.className = 'imgSample';
                sampleDiv.appendChild(img);
            }                         

            node.env('auto', function() {
                node.timer.randomExec(function() {
                    next.click();
                }, 2000);
            });
        });
        
    });
    
    
    return true;
}

function sample() {
    console.log('*** sample ! ***');
    var sampleDiv, instructions, next;
    var doneTimer, doneTimerSpan;

    next = W.getElementById("doneButton");
    instructions = W.getElementById("instructions");
    sampleDiv = W.getElementById("sample");
    instructions.style.display = 'none';
    sampleDiv.style.display = '';
    doneTimerSpan = W.getElementById("doneTimer");
    
    doneTimer = node.widgets.add('VisualTimer', doneTimerSpan, {
        milliseconds: 90000,
        timeup: 'CAN_DO_NEXT',
        name: 'candonext',
        fieldset: null
    });    
    doneTimer.start();

    node.on('CAN_DO_NEXT', function() {
        next.disabled = false;
    });   

    node.env('auto', function() {
         node.timer.randomExec(function() {
             doneTimer.stop();
             next.disabled = false;
             next.click();
         }, 2000);
    });

    return true;    
}

function thankyou() {
    console.log('thank you.');
    
    W.loadFrame('/facerank/html/thankyou.html', function() {
        node.on.data('WIN', function(msg) {
            var win, exitcode, codeErr;
            codeErr = 'ERROR (code not found)';
            win = msg.data && msg.data.win || 0;
            exitcode = msg.data && msg.data.exitcode || codeErr;
	    W.writeln('Your bonus in this game is: ' + win);
            W.writeln('Your exitcode is: ' + exitcode);
	});
    });
}

// Creating stages and steps

stager.addStep({
    id: 'instructionsText',
    cb: instructionsText
});

stager.addStep({
    id: 'sample',
    cb: sample
});

stager.addStage({
    id: 'instructions',
    steps: ['instructionsText', 'sample'],
    steprule: stepRules.SOLO
});


stager.addStage({
    id: 'facerank',
    cb: facerank,
    steprule: stepRules.SOLO
});

stager.addStage({
    id: 'thankyou',
    cb: thankyou,
    steprule: stepRules.SOLO
});

// Now that all the stages have been added,
// we can build the game plot

stager.init()
    .next('instructions')
    .next('facerank')
    .next('thankyou')
    .gameover();

stager.setOnGameOver(function() {
    // show exit code
});

// We serialize the game sequence before sending it
game.plot = stager.getState();

// Let's add the metadata information

game.metadata = {
    name: 'facerank',
    version: '0.0.2',
    session: 1,
    description: 'no descr'
};


// Other settings, optional

game.settings = {
    publishLevel: 0
};

game.env = {
    auto: settings.AUTO
}
