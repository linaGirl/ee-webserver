(function() {
    'use strict';



    const EventEmitter  = require('ee-event-emitter');
    const log           = require('ee-log');
    const url           = require('url');
    const querystring   = require('querystring');
    const debug         = process.argv.includes('--trace-webserver');





    module.exports = class extends EventEmitter {




        // remote IP address
        get ip() {
            return this.getHeader('x-forwarded-for') || this._request.connection.remoteAddress || null;
        }

        // return the ip of the requeter
        get requestIp() {
            return this._request.connection.remoteAddress || null;
        }

        // return the forwarded ip
        get forwardedIp() {
            return this.getHeader('x-forwarded-for') || null;
        }

        // request language defined by url ( if enabled ), cookie ( if enabled ) or accept-language HTTP header
        get language() {
            return this._getRequestLanguage();
        }

        set language(newLang) {
            this._language = newLang;
        }

        // request language defined by url ( if enabled ), cookie ( if enabled ) or accept-language HTTP header
        get languages() {
            return this._getRequestLanguages();
        }


        // the pathname ( without the language part )
        get pathname() {
            try{
                return decodeURIComponent(this.getUri().pathname || "");
            } catch (e){
                return this.getUri().pathname;
            }
        }

        set pathname(newPath) {
            this._uri.pathname = newPath;
        }

        get hostname() {
            return this.getUri().hostname;
        }

        get url() {
            return this._request.url;
        }

        get query() {
            return this.getUri().query;
        }

        get querystring(){
            return  url.parse(this._request.url).query || "";
        }

        set query(query){
            this.getUri().query = query;
        }


        get range() {
            if (this._rangeHeader) return this._rangeHeader;
            else if (this.hasHeader('range')) {
                this._rangeHeader = [];

                this.getHeader('range').split(',').forEach(function(header) {
                    header = /\s*([a-z0-9]+)\s*=?([0-9]+)\s*-\s*([0-9]+)/.exec(header);

                    if (header) {
                        this._rangeHeader.push({
                              type  : header[1]
                            , start : header[2]
                            , end   : header[3]
                        });
                    }
                }.bind(this));

                return this._rangeHeader;

            }
            return null;
        }




        constructor(options) {
            super();

            // the node.js request object
            Object.defineProperty(this, '_request', {value: options.request});
            Object.defineProperty(this, '_requestsWithBodyData', {value: ['post', 'patch', 'put', 'delete']});

            // method
            this.method = this._request.method.toLowerCase();

            // set up readable interface
            this.setUpStream();

            // loggign
            if (debug) {
                log.warn(this.method+' Request on «'+this.hostname+this.pathname+'», headers, query:');
                log.dir(this.getHeaders());
                log.dir(this.query);
            }
        }




        setResponse(response) {
            this.response = response;
        }


        // the request language is defined as follows:
        // 1. if set the first part of the url ( /en/user/1 -> en )
        // 2. if set the language cookie ( language=de -> de )
        // 3. if set via http accept-language header
        _getRequestLanguage() {
            if (this._language) return this._language; // cached
            else {
                this._language = null;

                var langHeader = this.getHeader("accept-language", true);

                if (langHeader && langHeader.length){
                    this._language = langHeader[0].key.toLowerCase();
                }
            }

            // return from cache
            return this._language;
        }

        // the request language is defined as follows:
        // 1. if set the first part of the url ( /en/user/1 -> en )
        // 2. if set the language cookie ( language=de -> de )
        // 3. if set via http accept-language header
        _getRequestLanguages() {
            var   baseLang = this.language
                , map = {};

            if (this._languages) return this._languages; // cached
            else {
                this._languages = null;

                var langHeader = this.getHeader("accept-language", true);

                if (langHeader && langHeader.length){
                    this._languages = langHeader.map(function(lang) {
                        return lang.key.toLowerCase();
                    });
                }
            }

            // add the bas e language into the first position
            if (this._languages) {
                this._languages = this._languages.filter(function(lang) {
                    if (map[lang]) return false;
                    map[lang] = true;
                    return lang !== baseLang;
                })

                this._languages.unshift(baseLang);
            }
            else {
                this._languages = [baseLang];
            }

            // return from cache
            return this._languages;
        }


        getCookie(cookiename) {
            return (new RegExp(cookiename + '=([^;]+)(?:;|$)', 'gi').exec(this.getHeader('cookie')) || [null, null])[1];
        }

        getHeader(name, parsed) {
            name = (typeof name === 'string' ? name.toLowerCase() : '');

            if (this._request.headers[name]) {
                if ((name === 'filter' || name === 'select') && this._request.headers[name].substr(0, 2) === ';;') this._request.headers[name] = decodeURIComponent(this._request.headers[name].substr(2));

                if (parsed) {
                    return this.parseHeader(this._request.headers[name])
                }
                else {
                    return this._request.headers[name];
                }
            }
            return null;
        }

        setHeader(name, value) {
            name = name.toString().toLowerCase();
            this._request.headers[name] = value;
        }

        getHeaders() {
            return this._request.headers;
        }

        hasHeader(name) {
            return !!this._request.headers[name];
        }

        getUri() {
            if (!this._uri) this._uri = url.parse('http://' + this._request.headers.host + this._request.url, true);
            return this._uri;
        }

        getRequest() {
            return this._request;
        }

        parseHeader(header) {
            var parts = header.split(',').map((part) => {
                var items = /^([a-z0-9\.\+\*]+)[\/\-]?([a-z0-9\.\+\*]*)\;?q?=?([0-9\.]*)$/gi.exec(part.trim());

                return {
                      key:      items && items[1] ? items[1].toLowerCase() : ''
                    , value:    items && items[2] ? items[2].toLowerCase() : ''
                    , q:        items && items[3] ? parseFloat(items[3]) : 1
                };
            }).sort((a, b) => {
                return a.q === b.q ? 0 : (a.q > b.q ? -1 : 1);
            });

            return parts.length > 0 ? parts: null;
        }



        // implement streaming interface ( readle stream v2 )
        setUpStream() {
            this.on('listener', this.handleListener.bind(this));
        }


        read() {
            return this._request.read.apply( this._request, Array.prototype.slice.call(arguments, 0));
        }
        setEncoding() {
            return this._request.setEncoding.apply(this._request, Array.prototype.slice.call(arguments, 0));
        }
        resume() {
            return this._request.resume.apply(this._request, Array.prototype.slice.call(arguments, 0));
        }
        pause() {
            return this._request.pause.apply(this._request, Array.prototype.slice.call(arguments, 0));
        }
        pipe() {
            return this._request.pipe.apply(this._request, Array.prototype.slice.call(arguments, 0));
        }
        unpipe() {
            return this._request.unpipe.apply(this._request, Array.prototype.slice.call(arguments, 0));
        }
        unshift() {
            return this._request.unshift.apply(this._request, Array.prototype.slice.call(arguments, 0));
        }
        wrap() {
            return this._request.wrap.apply(this._request, Array.prototype.slice.call(arguments, 0));
        }


        handleListener(evt, listener) {
            switch( evt ){
                case 'readable':
                case 'data':
                case 'end':
                case 'close':
                case 'error':
                    this._request.on(evt, listener);
            }
        }



        abort(code) {
            this._request.pause();

            this.response.send(null, null, code || 500);

            this.response.on('close', function() {
                this._request.socket.destroy();
            }.bind(this));
        }
    };
})();
