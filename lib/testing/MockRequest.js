"use strict";

var   Class             = require('ee-class')
    , log               = require('ee-log')
    , EEEventEmitter    = require('ee-event-emitter');

module.exports = new Class({

      inherits: EEEventEmitter

    , headers: null
    , connection: null
    , remoteAddress: null
    , encoding: null

    , init: function initialize(options) {
        this.headers        = options.headers || {};
        this.headers.host   = options.host || options.headers.host;

        this.remoteAddress  = options.remoteAddress || '127.0.0.1';
        this.connection     = { remoteAddress: this.remoteAddress };
        this.url            = options.url;
        this.method         = options.method || 'GET';
    }

    , _propagate: function(evt, args){
        args = Array.prototype.slice.call(args, 0);
        args.unshift(evt);
        this.emit.apply(this, args);
    }

    , read: function(){
        this._propagate('read', arguments);
    }

    , setEncoding: function(enc){
        this.encoding = enc;
    }

    , resume: function(){
        this._propagate('resume', arguments);
    }

    , pause: function(){
        this._propagate('pause', arguments);
    }

    , pipe: function(){
        this._propagate('pipe', arguments);
    }

    , unpipe: function(){
        this._propagate('unpipe', arguments);
    }

    , unshift: function(){
        this._propagate('unshift', arguments);
    }

    , wrap: function(){
        this._propagate('wrap', arguments);
    }

});