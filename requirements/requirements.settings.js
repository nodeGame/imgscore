/**
 * # Requirements settings
 * Copyright(c) 2015 Stefano Balietti <futur.dorko@gmail.com>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // If enabled a Requirements room will be created in the channel,
    // and all incoming connections will be tested there.
    enabled: true, // [false] Default: TRUE.

    // Path the requirement room logic.
    // logicPath: './requirements.room.js',

    // Future option. Not available now. Path to login page in `public/`
    // page: 'requirements.htm',

    // Optional. Maximum time to pass the tests of all requirements.
    maxExecTime: 8000,

    /**
     * ## viewportSize
     *
     * If set, client must have a resolution between the min and max specified
     *
     * Available options (more will be added):
     *
     *  - parser: (optional) a function that will parse the userAgent.
     *            Default function is `ua-parser-js`
     *  - cb: a callback that takes an object containing the parsed userAgent
     *        and must return an object of the type:
     *        { success: true/false, errors: undefined|array of strings }
     *
     * @see https://github.com/faisalman/ua-parser-js
     */
    browserDetect: {
        cb: function(ua, params) {
            if (ua.device.model || ua.device.type) {
                return {
                    success: false,
                    errors: [ 'It seems you are using a mobile or tablet ' +
                              'device. You can participate to this game ' +
                              'only from a desktop or laptop computer with ' +
                              'a keyboard and a mouse. If you can, try with ' +
                              'another browser or device.' ]
                };
            }

            return { success: true };
        }
    },

    /**
     * ## viewportSize
     *
     * Client must have a resolution between the min and max specified
     */
    viewportSize: {
        minX: 800,
        minY: 740
    },

    /**
     * ## cookieSupport
     *
     * If set, client must support setting cookies.
     *
     * Accepted values:
     *
     *   - 'persistent': cookies must persist across session
     *   - 'session': cookies must be set within same session
     */
    cookieSupport: 'persistent'
};
