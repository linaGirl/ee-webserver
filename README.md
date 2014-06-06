# ee-webserver

A simple webserver used by the ee framework.

- listen on any interface class or hostname
- listen on a defined or a random port
- request & response abstraction
    

## build status

[![Build Status](https://travis-ci.org/eventEmitter/ee-webserver.png?branch=master)](https://travis-ci.org/eventEmitter/ee-webserver)


# API

## Constructor

	var server = new Webserver(config);

The constructor accepts a config object which defines on which interfaces 
to listen on. The specific interface classifiers can be obtained from the
Webserver class contructor.

	var server = new Webserver({
		  interface: Webserver.IF_INTERNAL
		, port: 80
	});

The available interface classifiers are as folows:


- **IF_PUBLIC**: listen on all public interfaces
- **IF_PRIVATE**: listen on all private interfaces ( RFC 1918, 192.168.x.y, 10.x.y.z, 172.16.x.y - 172.31.x.y, fc00:: )
- **IF_INTERNAL**: listen on localhost ( 127.0.0.1, ::1, fe80::/7 )
- **IF_ANY**: listen on any interface
- **IF_V4_PRIVATE**: listen on private v4 interfaces
- **IF_V6_PRIVATE**: listen on private v6 interfaces
- **IF_V4_INTERNAL**: listen on 127.0.0.1
- **IF_V6_INTERNAL**: listen on fc00::/7, ::1
- **IF_V4_PUBLIC**: listen on all v4 public interfaces
- **IF_V6_PUBLIC**: listen on all v6 public interfaces
- **IF_V4_ANY**: listen on any v4 interfaces
- **IF_V6_ANY**: listen on any v6 interfaces


## Listen Method

the lsiten method opens all configurerd server instances.

	server.listen(function(err){
		if (err) console.log('stuff failed. one ore more servers failed to come up. review your logs ...');
		else console.log('We\'re online, yeah!');
	});


## Request Event

The request event is fired when any of the started webserver instances 
receives a request. The event receives two arguments - the request and
the response object.

	server.on('request', function(request, response){
		if (request.pathname === '/what') response.send(200, 'that!');
		else response.send(404);
	});



## Close Method

The close method closes the servers.

	server.close(function(err){
		if (err) console.log('stuff failed. one ore more servers failed to close. review your logs ...');
		else console.log('We\'re offline :(');
	});







## Request Class

The request object is received via the «request» event on the server 
object instance. 

### Read only properties

- **ip**: returns either the ip set in the «x-forwarded-for» header or the ip from the request
- **requestIp**: returns the ip from the request
- **forwardedIp**: returns the ip set in the «x-forwarded-for» header
- **hostname**: returns the hostane header
- **url**: returns the url string
- **querystring**: returns the querstrting portion of the url


### Writable properies

- **language**: gets or sets the request language. Gets the language from the «accept-language» header.
- **pathname**: gets or sets the requests pathname
- **query**: gets or sets an object containing the query paramters (extracted from the url)


### getCookie Method

The getCookie method extracts a cookie by name from the cookie header and returns it contents or null.

	var cookieValue = request.getCookie('sid');


### getHeader Method

The getHeader method returns a http header by its name. If the second argument is set to true the 
method tries to parse the header content by the format «x, y;q=1, z;q=.5». Using the input 
«da, en-gb;q=0.8, en;q=0.7» the function will the values as listen below

	var acceptLanguage = request.getHeader('accept-language');
	// da, en-gb;q=0.8, en;q=0.7

	var acceptLanguageArray = request.getHeader('accept-language', true);
	// [
	//		{
	// 			  key: "da"
	// 			, q: 1
	// 			, value: ""
	//		}, {
	// 			  key: "en"
	// 			, q: 1
	// 			, value: "gb"
	//		}, {
	// 			  key: "en"
	// 			, q: 0.5
	// 			, value: ""
	//		}
	// ]


### getHeaders Method

The getHeaders resturns all request headers as an object.

	var headers = request.getHeaders();
	//	{
	//	    host: "127.0.0.1:13023"
	//	    , connection: "keep-alive"
	//	}


### getUri Method

The getUri method returns the parsed url as an object.

	var headers = request.getUri();

	// {
	//    protocol: "http:"
	//    , slashes: true
	//    , auth: null
	//    , host: "127.0.0.1:13023"
	//    , port: "13023"
	//    , hostname: "127.0.0.1"
	//    , hash: null
	//    , search: ""
	//    , query: {}
	//    , pathname: "/"
	//    , path: "/"
	//    , href: "http://127.0.0.1:13023/"
	// }


### getRequest method

The getRequest method returns the raw request object as provided by node.js.

	var request = request.getRequest();


### parseHeader Method

The parseHeader method is used to parse headers. Its used by the «getHeader» method.

	var parsedHeader = request.parseHeader(request.getHeader('accept-language'));


### abort Method

The abort method aborts the request with the statuscode 500 or the code provided by the caller.
It closes the request without waiting for any more data.

	request.abort(statusCode || 500);



## Response Class

The response object is received via the «request» event on the server 
object instance. 


### Read only properties

- **isSent**: returns true when the response was closed an no more data can be written to it.

### Writable properies

- **headers**: the response headers. do not manipulate this object directly. Use the «setHeader» or «setHeaders» method instead.
- **statusCode**: the response statuscode. defaults to 500. the statuscode can be set using the «send» mthod
- **query**: gets or sets an object containing the query paramters (extracted from the url)


### setContentType Method

The setContentType method sets the contentype header for the response

	response.setContentType('Application/JSON');


### setCookie method

The setCookie method sets a cookie header. You can set as many cookies with the same name as you want.

	response.setCookie('sid', '654A564B654E55D4C5F5FF54FF...');


### setHeader method

The setHeader method sets a header on the response. If you set one header mutiple times it will also be sent multiple times.

    response.setHeader('Contet-Type', 'Application/JSON');


### setHeaders method

The setHeaders method sets multiplle headers at once on the response. If you set one header mutiple times it will also be sent multiple times.

    response.setHeader({
     	  'Contet-Type': 'Application/JSON'
     	, 'Date': new Date()
    });

### removeHeader method

The removeHeader method removes any instance of the specified header.

	response.removeHeader('Content-Type');

### getRequest method

The getRequest method returns the native node http response object

	var res = response.getResponse();

### send method

the send methos can be used to send data to the client. it accepts its parameter in any order. If it encounters a paramater with the type «number» it
will interpret it as the statuscode to use (if not provided the code 500 will be used). If it encounters a string or a buffer it will send it as the 
body of the response. if it finds an argument of the type «object» it will set every key of that object as response header.

the method compresses the contents and sends them to the client. it ends the response when done.
	
	// send an empty http status 500 response
	response.send();

	// send an string with the http status 200
	response.send(200, 'hi there :)');

	// send a JSON response
	response.send({'Content-Type': 'Application/JSON'}, JSON.stringify({any: 'data'}), 200);

	// sends a 201 created response
	response.send(201, {Location: '/u..'});




### write method

The write method can be used to send data i nchunks to the client

	response.write(Buffer);

### end method

the end method will end the response.

	response.end();



## example

	var Webserver = require('ee-webserver');


	new Webserver({
			  interface: 	Webserver.IF_INTERNAL
			, port:  		12001
		}
		, on: {
			request: function(request, response){
				response.send('hi ;)');
			}
		}
	} ).listen(function(err){
		// the server listens now on 127.0.0.1 and [::1]
	});

#testing
To simplify testing for other applications the internal `Request` and `Response` can now be filled with
mock objects found in the testing sub. Consider the following options:

    var EEWebserver = require('ee-webserver');
    var requestOptions = {
            host: 'some.test.com'
            , headers: {
                "accept-language":  'de',
                "accept":           'application/json;q=1, application/xml;q=0.8, */*;q=0.1'
            }
            , remoteAddress: '127.0.0.2'
            , url: '/some/path/var/?varOne=1&varTwo=salee'
            , method: 'POST'
        }
        , responseOptions = {
             headers:{'content-type':'text/plain'}
             , status: 404
        };

These options can be inserted into the mock objects:

    var   mockRequest = new EEWebserver.testing.MockRequest(requestOptions)
        , testRequest = new EEWebserver.Request(mockRequest)

        , mockResponse = new EEWebserver.testing.MockResponse(responseOptions)
        , testResponse = new EEWebserver.Response({
            request: testRequest
            , response: mockResponse
        });

This now allows you to inject `Request/Response` pairs e.g. into your middleware and inspect their state, or the state
of the wrapped HTTPRequests. For instance, we could check if the response status and content is correct:

    mockResponse.on('end', function(content){
        assert.equal(this.status, 200);
        assert.equal(content.toString(), '<h1>some html</h1>');
        assert.equal(this.headers['content-type'], 'text/html');
    }.bind(mockResponse));
    myapplication.request(testRequest, testResponse);

For more information please consult the tests in `test/MockObjectsTests.js`.