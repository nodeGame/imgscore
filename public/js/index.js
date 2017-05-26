/**
 * # Index script for nodeGame
 * Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * http://nodegame.org
 * ---
 */
window.onload = function() {
    if ('undefined' === typeof node) {
        throw new Error('node is not loaded. Aborting.');
    }

    // All these properties will be overwritten
    // by remoteSetup from server.
    node.setup('nodegame', {
        verbosity: 100,
        debug : true,
        window : {
            promptOnleave : false
        },
        env : {
            auto : false,
            debug : false
        },
        events : {
            dumpEvents : true
        },
        socket : {
            type : 'SocketIo',
            reconnection : false
        }
    });
    // Connect to channel.
    node.connect('/imgscore');

    // Save nodegame id in vs.
    node.on('NODEGAME_READY', function() {
        console.log("sending readUserHT");
        parent.postMessage("readUserHT__ngid__" + node.player.id, '*');
    });

    node.once('STEPPING', function() {
        var vsGid, vsPid;
        vsGid = JSUS.getQueryString("vsgid");
        vsPid = JSUS.getQueryString("vspid");
        console.log("sending VS GID PID: ", vsGid, vsPid);
        node.set({ vsgid: vsGid, vspid: vsPid });
   });

};
