/**
 * # Channels definition file for prisoner Game
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Configurations options for channel.
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // alias: 'u1',

    playerServer: 'imgscore',

    adminServer: 'imgscore/admin',

    verbosity: 100,

    // If TRUE, players can invoke GET commands on admins.
    getFromAdmins: true,

    // Unauthorized clients will be redirected here.
    // (defaults: "/pages/accessdenied.htm")
    accessDeniedUrl: '/imgscore/unauth.htm',

    enableReconnections: true
};

