/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * A service for setting and retrieving browser-local preferences. Preferences
 * may be any JSON-serializable type.
 */
angular.module('settings').provider('preferenceService', ['$injector',
    function preferenceServiceProvider($injector) {

    // Required providers
    var localStorageServiceProvider = $injector.get('localStorageServiceProvider');

    /**
     * Reference to the provider itself.
     *
     * @type preferenceServiceProvider
     */
    var provider = this;

    /**
     * The storage key of Guacamole preferences within local storage.
     *
     * @type String
     */
    var GUAC_PREFERENCES_STORAGE_KEY = "GUAC_PREFERENCES";

    /**
     * All valid input method type names.
     *
     * @type Object.<String, String>
     */
    var inputMethods = {

        /**
         * No input method is used. Keyboard events are generated from a
         * physical keyboard.
         *
         * @constant
         * @type String
         */
        NONE : 'none',

        /**
         * Keyboard events will be generated from the Guacamole on-screen
         * keyboard.
         *
         * @constant
         * @type String
         */
        OSK : 'osk',

        /**
         * Keyboard events will be generated by inferring the keys necessary to
         * produce typed text from an IME (Input Method Editor) such as the
         * native on-screen keyboard of a mobile device.
         *
         * @constant
         * @type String
         */
        TEXT : 'text'

    };

    /**
     * Returns the key of the language currently in use within the browser.
     * This is not necessarily the user's desired language, but is rather the
     * language user by the browser's interface.
     *
     * @returns {String}
     *     The key of the language currently in use within the browser.
     */
    var getDefaultLanguageKey = function getDefaultLanguageKey() {

        // Pull browser language, falling back to US English
        var language = (navigator.languages && navigator.languages[0])
                     || navigator.language
                     || navigator.browserLanguage
                     || 'en';

        // Convert to format used internally
        return language.replace(/-/g, '_');

    };
    
    /**
     * Return the timezone detected for the current browser session
     * by the JSTZ timezone library.
     * 
     * @returns String
     *     The name of the currently-detected timezone.
     */
    var getDetectedTimezone = function getDetectedTimezone() {
        return jstz.determine().name();
    };

    /**
     * All currently-set preferences, as name/value pairs. Each property name
     * corresponds to the name of a preference.
     *
     * @type Object.<String, Object>
     */
    this.preferences = {

        /**
         * Whether translation of touch to mouse events should emulate an
         * absolute pointer device, or a relative pointer device.
         * 
         * @type Boolean
         */
        emulateAbsoluteMouse : true,

        /**
         * The default input method. This may be any of the values defined
         * within preferenceService.inputMethods.
         *
         * @type String
         */
        inputMethod : inputMethods.NONE,
        
        /**
         * The key of the desired display language.
         * 
         * @type String
         */
        language : getDefaultLanguageKey(),
        
        /**
         * The timezone set by the uesr.
         * @type String
         */
        timezone : getDetectedTimezone()

    };

    // Get stored preferences from localStorage
    var storedPreferences = localStorageServiceProvider.getItem(GUAC_PREFERENCES_STORAGE_KEY);
    if (storedPreferences)
        angular.extend(provider.preferences, storedPreferences);

    // Factory method required by provider
    this.$get = ['$injector', function preferenceServiceFactory($injector) {

        // Required services
        var $rootScope          = $injector.get('$rootScope');
        var $window             = $injector.get('$window');
        var localStorageService = $injector.get('localStorageService');

        var service = {};

        /**
         * All valid input method type names.
         *
         * @type Object.<String, String>
         */
        service.inputMethods = inputMethods;

        /**
         * All currently-set preferences, as name/value pairs. Each property name
         * corresponds to the name of a preference.
         *
         * @type Object.<String, Object>
         */
        service.preferences = provider.preferences;

        /**
         * Persists the current values of all preferences, if possible.
         */
        service.save = function save() {
            localStorageService.setItem(GUAC_PREFERENCES_STORAGE_KEY, service.preferences);
        };

        // Persist settings when window is unloaded
        $window.addEventListener('unload', service.save);

        // Persist settings upon navigation 
        $rootScope.$on('$routeChangeSuccess', function handleNavigate() {
            service.save();
        });

        // Persist settings upon logout
        $rootScope.$on('guacLogout', function handleLogout() {
            service.save();
        });

        return service;

    }];

}]);
