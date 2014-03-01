/**
 * # Face categorization game - Client
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Client receives links of images and it goes through them
 * displaying a set of categories to choose from and a tag box.
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

function facecat() {
    console.log('facecat');
    W.loadFrame('/facecat/html/facepage.htm', function() {
        var next, faceImg, td, dlcat, tagTr, tagInput, previousTags;
        var helpTags, helpTagsLink;
        var helpCats, helpCatsLink;

        var translate_radio = {
            'hface': 'Human face',
            'nhface': 'Non-human face',
            'abstract': 'Abstract lines',
            'other': 'Any other known object or shape'
        };

        var chosen_cat, order;
        var time2cats, time2tags;

        node.on('radio', function(radio) {
            time2cats = node.timer.getTimeSince('cats_displayed');
            chosen_cat = radio.id.substr(3);
            console.log('chosen: ' + chosen_cat);
            selectedSpan.innerHTML = translate_radio[chosen_cat];
            displayTags();
        });

        node.on('undo_radio', function() {
            console.log('undoing ' + chosen_cat);
            chosen_cat = null;
            next.disabled = true;
            selectedSpan.innerHTML = '';
            displayCats();
        });

        node.on('helpCats', function() {
            if (helpCats.style.display === 'none') {
                helpCats.style.display = '';
                helpCatsLink.innerHTML = 'Hide help';
            }
            else {
                helpCats.style.display = 'none';
                helpCatsLink.innerHTML = 'Show help';
            }
        });

        node.on('helpTags', function() {           
            if (helpTags.style.display === 'none') {
                helpTags.style.display = '';
                helpTagsLink.innerHTML = 'Hide help';
            }
            else {
                helpTags.style.display = 'none';
                helpTagsLink.innerHTML = 'Show help';
            }
        });

        function displayTags() {
            td.style.display = 'none';
            tagInput.value = '';
            tagTr.style.display = '';
            next.disabled = false;
            next.innerHTML = 'Next';
            node.timer.setTimestamp('tags_displayed');
            // Hide help at the beginning
            if (helpTags.style.display === '') {
                helpTags.style.display = 'none';
                helpTagsLink.innerHTML = 'Show help';
            }
            node.env('auto', function() {
                node.timer.randomExec(function() {
                    var tags;
                    if (Math.random() > 0.5) {
                        if (Math.random() > 0.5) {
                            tagInput.value = Math.random().toFixed(2);
                        }
                        else {
                            tags = node.game.previousTags;
                            for (var i in tags) {
                                if (Math.random() > 0.7) {
                                    tagInput.value += tags[i] + ', ';
                                }
                            }
                        }
                    }   
                    next.click();
                }, 2000);
            });
        }

        function displayFace() {
            var imgPath;
            imgPath = node.game.faces.items[++node.game.counter].path;
            faceImg.src = '/facecat/faces/' + imgPath;
            // console.log(imgPath);
            node.timer.setTimestamp('cats_displayed');
            displayCats()
        }
        
        function displayCats() {
            td.style.display = '';
            if (chosen_cat) {
                W.getElementById('radio_' + chosen_cat).checked = false;
            }
            // next.disabled = true;
            next.innerHTML = 'Select a category';
            tagTr.style.display = 'none';
            
            // Hide help at the beginning.
            if (helpCats.style.display === '') {
                helpCats.style.display = 'none';
                helpCatsLink.innerHTML = 'Show help';
            }

            order = JSUS.shuffleNodes(dlcat, JSUS.sample(0,3));

            node.env('auto', function() {
                var array = ['hface', 'nhface', 'abstract', 'other'];
                var choice = W.getElementById('dt_' + array[JSUS.randomInt(0,3)]);
                node.timer.randomExec(function() {
                    node.emit('radio', choice);
                }, 2000);
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
            var tags, faces, obj, i, len, secondSet, counter;
            time2tags = node.timer.getTimeSince('tags_displayed');

            counter = node.game.counter;
            faces = node.game.faces;
            next.disabled = true;

            if (counter !== -1 && counter < faces.items.length) {
                tags = tagInput.value.trim().split(',');
                // Cleaning and adding tags to the list.
                for (i = 0 ; i < tags.length; i++) {
                    tags[i] = tags[i].trim();
                    addTag2List(tags[i]);
                }
                obj = {
                    session: faces.id, 
                    player: faces.player,
                    round: faces.items[counter].round,
                    morn: faces.morn,
                    path: faces.items[counter].path,
                    count: faces.count,
                    cat: chosen_cat,
                    tags: tags,
                    order: order,
                    time2cats: time2cats,
                    time2tags: time2tags
                };
                node.set('cat', obj);
            }

            if (!faces.items || counter >= (faces.items.length -1)) {
                node.get('NEXT', onNextFaces);
            }
            else {                              
                displayFace();
            }
        }

        function addTag2List(tagName) {
            var li;
            if ('string' !== typeof tagName) {
                throw new Error('addTag2List: tag must be string.');
            }
            if (tagName === '') {
                return;
            }
            // Adding only new tags.
            if (!node.game.previousTags[tagName]) {
                node.game.previousTags[tagName] = tagName;
                li = document.createElement('li');
                li.appendChild(document.createTextNode(tagName));
                li.name = tagName;
                li.onclick = function() {
                    tagInput.value += (tagName + ', ');
                };
                
                previousTags.appendChild(li);
            }
        };

        // Elements of the page.
        
        // Next button.
        next = W.getElementById("doneButton");
        
        // Img.
        faceImg = W.getElementById('face');
        
        // Categories.
        td = W.getElementById('td_radio');
        dlcat = W.getElementById('dlcat');
        helpCats = W.getElementById('helpCats');
        helpCatsLink = W.getElementById('helpCatsLink');
        
        // Tags
        selectedSpan = W.getElementById('radio_selected');
        tagTr = W.getElementById('trtags');
        tagInput = W.getElementById('tag');
        previousTags = W.getElementById('previousTags');

        helpTags = W.getElementById('helpTags');
        helpTagsLink = W.getElementById('helpTagsLink');

        // Click!
        next.onclick = askForNext;
        next.click();
    });
    return true;
};

function instructionsText() {
    console.log('instructions');
    W.loadFrame('/facecat/html/instructions.htm', function() {
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
                img.src = '/facecat/faces/' + imgPath;
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
    
    W.loadFrame('/facecat/html/thankyou.html', function() {
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
    id: 'facecat',
    cb: facecat,
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
    .next('facecat')
    .next('thankyou')
    .gameover();

stager.setOnGameOver(function() {
    // show exit code
});

// We serialize the game sequence before sending it
game.plot = stager.getState();

// Let's add the metadata information

game.metadata = {
    name: 'facecat',
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
