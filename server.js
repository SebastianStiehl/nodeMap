var express = require('express'),
	http = require('http'),
    socket = require('socket.io'),
    port = 80,
    socketClient, server, io, app;

function emit(type, data) {
	io.sockets.emit(type, data);
}

function routeFiles() {
    app.get('/', function (req, res) {
        res.sendfile(__dirname + '/index.html');
    });
	
	app.use(express.static(__dirname + '/'));
}

function routeActions() {
    app.get('/update', function (req, res) {
        var id = req.param("id", null),
            lat = req.param("lat", null),
            lng = req.param("lng", null);

        emit('update', {id: id, geo: {lat: lat, lng: lng}});
        res.send('thx');
    });

    app.get('/delete', function (req, res) {
        var id = req.param("id", null);

        emit('delete', {id: id});
        res.send('thx');
    });
}

function openSockets() {
    io.sockets.on('connection', function () {
    });
}

app = express();
server = http.createServer(app);
server.listen(port);
io = socket.listen(server, {log: false})


openSockets();
routeFiles();
routeActions();


console.log('Listening on port ' + port);
