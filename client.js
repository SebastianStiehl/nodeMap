$(function () {

    var map,
        maxMarkers = 200,
        updateCounter = 0,
        deleteCounter = 0,
        markerStatus,
        deleteStatus,
        updateStatus,
        markers = [],
        mapOptions = {
            disableDefaultUI: true,
            zoom: 8,
            center: new google.maps.LatLng(51.18, 10.35),
            mapTypeControlOptions: {
                mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
            }
        },
        mapStyles = [{"elementType": "labels.text", "stylers": [ { "visibility": "off" } ] }, { "featureType": "water", "stylers": [ { "color": "#409de6" } ] }, { "featureType": "administrative.locality", "stylers": [ { "visibility": "simplified" }, { "color": "#b5e061" } ] }, { "featureType": "road", "stylers": [ { "visibility": "off" } ] }, { "featureType": "poi", "stylers": [ { "visibility": "off" } ] }, { "featureType": "landscape", "stylers": [ { "hue": "#ff5500" } ] }, { "featureType": "poi"  }, { "featureType": "administrative.country", "stylers": [ { "weight": 1.4 }, { "color": "#393a00" } ] }, { "featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [ { "visibility": "on" }, { "invert_lightness": true }, { "weight": 0.7 }, { "gamma": 2.15 } ] } ];
    
    function getIconOption() {
        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'orange',
            fillOpacity: 0.0,
            scale: 10,
            strokeColor: 'white',
            strokeWeight: 0.1
        };
    }
    
    function toggle(marker, on) {
        var iconOption = getIconOption();
        iconOption.fillOpacity = (on ? 1.0 : 0.0);
        marker.setIcon(iconOption);
        if (on === false) {
            marker.setMap(null);
        }
    }

    function fade(marker, action, readyCallback) {
        var counter, iconOption, interval;
        
        counter = 100;
        iconOption = getIconOption();
        interval = setInterval(function () {
            if (counter <= 0) {
                clearInterval(interval);
                if (typeof readyCallback === "function") {
                    readyCallback(marker);
                }
            }
            
            iconOption.fillOpacity = (action === "in" ? (1 - (counter / 100)) : (counter / 100));
            marker.setIcon(iconOption);
            counter -= 2;
        }, 100);
    }

    function createMarker(latLng, id) {
        var marker = new google.maps.Marker({
            position: latLng,
            map: map,
            icon: getIconOption()
        });

        markers.push({marker: marker, id: id});

        fade(marker, "in");
        
        return marker;
    }

    function isNewMarker(latLng) {
        var isOnMap = false;
        $.each(markers, function (index, markerWrapper) {
            var markerPosition = markerWrapper.marker.getPosition();
            if (markerPosition.lat() === latLng.lat() && markerPosition.lng() === latLng.lng()) {
                isOnMap = true;
            }
        });

        return !isOnMap;
    }
    
    function updateMarkerStatus() {
        if (!markerStatus) {
            markerStatus = $("<li/>");
            $("ul", "#statusBox").append(markerStatus);
        }
        
        markerStatus.text("marker: " + markers.length);
    }     
    
    function updateDeleteStatus() {
        if (!deleteStatus) {
            deleteStatus = $("<li/>");
            $("ul", "#statusBox").append(deleteStatus);
        }
        
        deleteStatus.text("deleted: " + (++deleteCounter));
    }    
    
    function updateUpdateCount() {
        if (!updateStatus) {
            updateStatus = $("<li/>");
            $("ul", "#statusBox").append(updateStatus);
        }
        
        updateStatus.text("updates: " + (++updateCounter));
    }
    
    function createInfoWindow(marker, content) {
        var infoWindow = new google.maps.InfoWindow({
            content: content
        });

        google.maps.event.addListener(marker, 'click', function () {
            infoWindow.open(map, marker);
        });
    }
    
    function checkMarkerCount() {
        var firstMarker;
        
        if ((markers.length + 1) > maxMarkers) {
            firstMarker = markers.shift();
            toggle(firstMarker.marker, false);
            
        }
    }

    function onMapLoaded() {
        var socket = io.connect('/');
        socket.on('update', function (data) {
            var content, id, latLng = new google.maps.LatLng(data.geo.lat, data.geo.lng);
            updateUpdateCount();
            
            if (isNewMarker(latLng)) {
                id = $('<div/>').text(data.id).html(); //escape html
                content = '<a href="http://devweb03.dev.is24.loc/expose/' + data.id + '" target="blank">Expose ' + data.id + '</a>';
                checkMarkerCount();
                createInfoWindow(createMarker(latLng, data.id), content);
                updateMarkerStatus();
            }
        });
        
        socket.on('delete', function (data) {
            var id = data.id;

            markers = jQuery.grep(markers, function (markerWrapper) {
                var filter = (id !== markerWrapper.id);
                if (!filter) {
                    fade(markerWrapper.marker, "out", function (marker) {
                        marker.setMap(null);
                    });
                    updateDeleteStatus();
                }
                return filter;
            });
            
            updateMarkerStatus();
        });
    }

    function fitBounds() {
        var southWest, northEast, bounds;
        southWest = new google.maps.LatLng(48.55, 6.94);
        northEast = new google.maps.LatLng(53.77, 13.07);
        bounds = new google.maps.LatLngBounds(southWest, northEast);
        map.fitBounds(bounds);
    }

    function initialize() {
        var date = new Date();
        $("ul", "#statusBox").append('<li>connected since: ' + (date.getDate()) + '.' + (date.getMonth() + 1) + '.' + (date.getYear() - 100) + '</li>');
        map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
        map.mapTypes.set('map_style', new google.maps.StyledMapType(mapStyles, {name: "Plain"}));
        map.setMapTypeId('map_style');
        fitBounds();
        
        google.maps.event.addListenerOnce(map, 'tilesloaded', onMapLoaded);
    }

    initialize();

});


//module for testing
$(function () {
    var examples;

    function fillExamples() {
        var i, max;
        
        examples = [];
        max = parseInt($("#numbersInput").val(), 10);

        if (!isNaN(max)) {
            for (i = 0; i < max; i++) {
                examples.push({lat: (48 + Math.random() * 6), lng: (8 + Math.random() * 6), id: (i + 1)});
            }
        } else {
            alert("wrong input type. expected a number.");
            $("#numbersInput").val(5);
        }
    }

    function attachButtonListeners() {
        $("#addButton").on("click", function () {
            fillExamples();
            $.each(examples, function (index, example) {
                $.get("/update?lat=" + example.lat + "&lng=" + example.lng + "&id=" + example.id);
            });
        });
        $("#removeButton").on("click", function () {
            fillExamples();
            $.each(examples, function (index, example) {
                $.get("/delete?id=" + example.id);
            });
        });
    }

    function checkDebugMode() {
        var i, param,
            parameters = window.location.href.split("?")[1];
    
        if (parameters) {
            parameters = parameters.split("&");
            for (i = 0; i < parameters.length; i += 1) {
                param = parameters[i].split("=");
                if (param[0] === "debug" && param[1] === "true") {
                    $("#statusBox").show();
                    attachButtonListeners();
                }
            }
        }
    }
    
    checkDebugMode()
});