"use strict";

var   Class   = require('ee-class')
    , log     = require('ee-log')
    , EEEventEmitter    = require('ee-event-emitter');

module.exports = new Class({
    inherits: EEEventEmitter

    , headers: {}
    , status: 500

    , init: function initialize(options){
        this.headers = options.headers || {}
        this.status = options.status || 500;
    }

    , setHeader: function(key, value){
        this.headers[key.toString().toLowerCase()] = value;
    }

    , writeHead: function(code, headers){
        this.status = code;
        for(var name in headers){
            this.setHeader(name, headers[name]);
        }
    }

    , _propagate: function(evt, args){
        args = Array.prototype.slice.call(args, 0);
        args.unshift(evt);
        this.emit.apply(this, args);
    }

    , end: function(){
        this._propagate('end', arguments);
    }

    , write: function(){
        this._propagate('write', arguments);
    }
});