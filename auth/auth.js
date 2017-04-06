/**
 * # Authorization functions
 * Copyright(c) 2016 brenste <myemail>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = function(auth) {

    // The auth object contains a number of callbacks that specify
    // how the channel handles authorization / identification
    // of incoming connections.

    // The Auth API defines 3 callbacks:

    // auth.authorization('player', authPlayers);
    // auth.clientIdGenerator('player', idGen);
    auth.clientObjDecorator('player', decorateClientObj);

    // All of them accept a variable number of parameters.
    // The first one specifies whether they apply only to
    // the 'player', the 'admin', (or both) server. If they
    // apply for both, this parameter can be omitted completely.
    // The second parameter defines the actual callback, and it
    // is explained in the examples below.

    // ## Authorization function
    //
    // Extra auth function beside default token authorization
    //
    // This is executed before the client the PCONNECT listener.
    // Here, direct messages to the client can be sent only using
    // his socketId property, since no clientId has been created yet.
    //
    // <channel> is a reference to the channel object, it is the same
    //           for all connections.
    //
    // <info> is an object containing information specific for the
    //        incoming connections, formatted as follows:
    //
    //      {
    //         headers: Info about connections
    //         cookies: Cookies passed on connections
    //         room: The requested room for connection, null otherwise
    //         clientId: If specified by the signed token, null otherwise
    //         clientType: The client type: e.g. 'player', 'bot', ...
    //         validSessionCookie: TRUE if the channel session is matched
    //      }
    //
    function authPlayers(channel, info) {
        // TRUE, means client is authorized.
        return true;
    }

    // ## Client ID generation function
    //
    // Specifies an ID for incoming connections
    //
    // Overwrites any cookie found
    //
    // See the authorization function for the explanation of the callback
    // input parameter <channel> and <info>.
    //
    // @see ServerChannel.registry.generateClientId
    //
    function idGen(channel, info) {
        // Returns a valid client ID (string) or undefined.
        return;
    }

    // ## Client object decoration function
    //
    // Modifies the client object that will be stored in the registry
    //
    // <clientObj> The client object contains already a number of properties,
    // which vary depending on the server configuration. Some properties
    // can never be modified, or an error will be thrown. They are:
    //
    //  - id
    //  - sid
    //  - admin
    //  - clientType
    //
    // <info> See the authorization function for description
    //
    // In this example the type of browser is added.
    //
    function decorateClientObj(clientObject, info) {
        var amtData;
        if (info.handshake.headers) {
            clientObject.userAgent = info.handshake.headers['user-agent'];
        }
        if (!clientObject.connectTime) clientObject.connectTime = Date.now();

        if (info.query) {
            amtData = info.query.id;
            if (!info.query.id) {
                console.log('no amt data!', clientObject.id);
                return;
            }
            amtData = atob(info.query.id);
            if ('object' === typeof amtData) {
                clientObject.WorkerId = amtData.w;
                clientObject.AssignmentId = amtData.a;
                clientObject.HitId = amtData.h;
            }
            else {
                clientObject.amtData = info.query.id;
            }
        }
    }

    // Assigning the auth callbacks to the player server.
    // auth.authorization('player', authPlayers);
    // auth.clientIdGenerator('player', idGen);
    auth.clientObjDecorator('player', decorateClientObj);

    // Decrypt base64 encoded strings.
    function atob(str) {
        str = new Buffer(str, 'base64').toString('binary');
        try {
            str = JSON.parse(str);
        }
        catch(e) {
            console.log(e);
            str = false;
        }
        return str;
    }
};
