


    var Webserver = require('./')
        , log = require('ee-log');


    var server = new Webserver({
          interface : Webserver.IF_ANY
        , port      : 8001
    });


    server.listen(function(err) {
        log(err);
    });


    server.on('request', function(request, response) {
        log(request.languages);
        response.send(200);
    });