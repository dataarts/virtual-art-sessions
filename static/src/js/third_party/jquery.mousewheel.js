import $ from 'jquery';

/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * modified heavily by @mattdw & @customlogic
 *
 * Version: 3.1.4
 *
 * Requires: 1.2.2+
 */

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];
    var toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    var lowestDelta = 0, lowestDeltaXY = 0, eventCount = 0;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    $.event.special.mousewheel = {
        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },

        unmousewheel: function(fn) {
            return this.unbind('mousewheel', fn);
        }
    });


    function handler(event) {
        var orgEvent   = event || window.event,
            args       = [].slice.call(arguments, 1),
            delta      = 0,
            deltaX     = 0,
            deltaY     = 0,
            absDelta   = 0,
            absDeltaXY = 0,
            fn;
        event = $.event.fix(orgEvent);
        event.type = 'mousewheel';

        // Old school scrollwheel delta
        if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta; }
        if ( orgEvent.detail )     { delta = orgEvent.detail * -1; }

        // At a minimum, setup the deltaY to be delta
        deltaY = delta;

        // Firefox < 17 related to DOMMouseScroll event
        if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
            deltaY = 0;
            deltaX = delta * -1;
        }

        // New school wheel delta (wheel event)
        if ( orgEvent.deltaY ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( orgEvent.deltaX ) {
            deltaX = orgEvent.deltaX;
            delta  = deltaX * -1;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY; }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Look for lowest delta to normalize the delta values
        absDelta = Math.abs(delta);
        //if ( !lowestDelta || absDelta > lowestDelta ) { lowestDelta = absDelta; }
        absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
        //if ( !lowestDeltaXY || absDeltaXY > lowestDeltaXY ) {
        //  lowestDeltaXY = absDeltaXY;
        //}

        // and we'll just cap these, too
        //absDelta = Math.min(absDelta, 400);
        //absDeltaXY = Math.min(absDeltaXY, 400);

        lowestDelta = (absDelta + (lowestDelta * eventCount)) / (eventCount + 1);
        lowestDeltaXY = (absDeltaXY + (lowestDeltaXY * eventCount)) / (eventCount + 1);
        if (!lowestDelta) {
        lowestDelta = 1;
        }
        if (!lowestDeltaXY) {
        lowestDeltaXY = 1;
        }
        eventCount += 1;

        // Get a whole value for the deltas
        //fn     = delta > 0 ? 'floor' : 'ceil';
        //delta  = Math[fn](delta  / lowestDelta);
        //deltaX = Math[fn](deltaX / lowestDeltaXY);
        //deltaY = Math[fn](deltaY / lowestDeltaXY);
        delta = delta / lowestDelta;
        deltaY = deltaY / lowestDeltaXY;
        deltaX = deltaX / lowestDeltaXY;
      
        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        event.delta = delta;
        event.deltaX = deltaX;
        event.deltaY = deltaY;


        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

}));
