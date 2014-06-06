var assert  = require('assert');

var   Request       = require('../lib/Request')
    , Response      = require('../lib/Response')
    , MockRequest   = require('../lib/testing/MockRequest')
    , MockResponse   = require('../lib/testing/MockResponse');

function getOptions(){
    return {
        host: 'some.test.com'
        , headers: {
            "accept-language":  'de',
            "accept":           'application/json;q=1, application/xml;q=0.8, */*;q=0.1'
        }
        , remoteAddress: '127.0.0.2'
        , url: '/some/path/var/?varOne=1&varTwo=salee'
        , method: 'POST'
    };

}
describe('MockRequest', function(){

    var   options       = getOptions()
        , testRequest   = new MockRequest(options)
        , request       = new Request({request: testRequest});

    it('should have the headers set', function(){
        assert.equal(testRequest.headers, options.headers);
    });
    it('should have the host set in its headers if passed', function(){
        assert.equal(testRequest.headers.host, options.host);
    });
    it('should have the url set', function(){
        assert.equal(testRequest.url, options.url);
    });
    it('should have the method set', function(){
        assert.equal(testRequest.method, options.method);
    });

    describe('Request', function(){
        it('should expose the pathname', function(){
            assert.equal('/some/path/var/', request.pathname);
        });

        it('should expose the query', function(){
            assert.deepEqual({ varOne: '1', varTwo: 'salee' }, request.query);
        });

        it('should expose the headers', function(){
            assert.equal(options.headers, request.getHeaders());
        });

        it('should expose single headers', function(){
            assert.equal('de', request.getHeader('accept-language'));
        });

        it('should expose and parse headers', function(){
            assert.deepEqual([ { key: 'application', value: 'json', q: 1 },
                               { key: 'application', value: 'xml', q: 0.8 },
                               { key: '*', value: '*', q: 0.1 } ]
                            , request.getHeader('accept', true));
        });

        it('should be able to set headers', function(){
            request.setHeader('test', true);
            assert.equal(request.getHeader('test'), true);
            assert.equal(testRequest.headers['test'], true);
        });

        it('should be able to test header existence', function(){
            assert.equal(request.hasHeader('accept'), true);
            assert.equal(request.hasHeader('api-version'), false);
        });

        it('should be able to expose the ip', function(){
            assert.equal(request.ip, '127.0.0.2');
        });

        it('should be able to expose the language', function(){
            assert.equal(request.language, 'de');
        });

        it('should be able to expose the method', function(){
            assert.equal(request.method, 'post');
        });

        describe('...streaming', function(){
            it('should be possible to subscribe to the events', function(done){
                testRequest.on('read', function(){
                    assert(true);
                    done();
                });
                request.read();
            })
        });
    })
});

describe('MockResponse', function(){
    var   options       = getOptions()
        , testRequest   = new MockRequest(options)
        , request       = new Request({request: testRequest})
        , responseOptions = {headers:{'content-type':'text/plain'}, status: 404}
        , testResponse  = new MockResponse(responseOptions)
        , response      = new Response({request: request, response: testResponse});

    it('should correctly set the headers', function(){
        assert.equal(testResponse.headers, responseOptions.headers);
    });

    it('and the status', function(){
        assert.equal(testResponse.status, responseOptions.status);
    });

    describe('Response', function(){
        it('should be possible to listen to the response', function(done){
            testResponse.once('end', function(data){
                try {
                    assert.equal(data.toString(), 'Supercool');
                    done();
                } catch(error){
                    done(error);
                }
            }.bind(testResponse));
            response.setContentType('text/plain');
            response.setHeader('test-header', 100);
            response.send(200, 'Supercool');
        });
        it('and the status should be correct', function(){
            assert.equal(testResponse.status, 200);
        });
        it('and the headers should be set correctly', function(){
            assert.equal(testResponse.headers['content-type'], 'text/plain');
            assert.equal(testResponse.headers['test-header'], 100);
        });
    });

});

describe('ee-webserver', function(){
    it('should expose the testing objects', function(){
        var webserver = require('../.');
        assert('testing' in webserver);
        assert('MockRequest' in webserver.testing);
        assert('MockResponse' in webserver.testing);

        assert('Request' in webserver);
        assert('Response' in webserver);
    });
});