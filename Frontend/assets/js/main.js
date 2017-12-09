(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var API_URL = "http://localhost:5050";

function backendGet(url, callback) {
    $.ajax({
        url: API_URL + url,
        type: 'GET',
        success: function(data){
            callback(null, data);
        },
        error: function() {
            callback(new Error("Ajax Failed"));
        }
    })
}

function backendPost(url, data, callback) {
    $.ajax({
        url: API_URL + url,
        type: 'POST',
        contentType : 'application/json',
        data: JSON.stringify(data),
        success: function(data){
            callback(null, data);
        },
        error: function() {
            callback(new Error("Ajax Failed"));
        }
    })
}

exports.getFlights = function(callback) {
    backendGet("/api/get-flights/", callback);
};

exports.createOrder = function(order_info, callback) {
    backendPost("/api/create-order/", order_info, callback);
};
},{}],2:[function(require,module,exports){
var map;

function initialize() {
    var mapProp = {
        center: new google.maps.LatLng(50.464379, 30.519131),
        zoom: 14
    };
    var html_element = document.getElementById("googleMap");
    map = new google.maps.Map(html_element, mapProp);
    var point = new google.maps.LatLng(50.464379, 30.519131);
    var marker = new google.maps.Marker({
        position: point,
//map - це змінна карти створена за допомогою new google.maps.Map(...)
        map: map
    });
//Карта створена і показана
}

exports.init=initialize;
},{}],3:[function(require,module,exports){
$(function(){
    var $logo = $("#logo");
    var canvas = document.getElementById('plane');
    var context;
    var GoogleMap=require('./googleMaps');

    var sits = new Array(40);
    var flights = null;
    var dates=null;
    var count=0;
    var API=require('./API');
    var Pay=require('./payment');
    API.getFlights(function (error, data){
        if(error)alert(error);
        else flights=data;
        changeFlight();
    });




    function fillDates(dest) {
        for (var i = 0; i < flights.length; i++) {
            if (flights[i].dest === dest) {
                dates=flights[i].dates;
                $("#date").empty();
                for(var j=0;j<dates.length;j++){
                    date.add(new Option(dates[j].date, dates[j].date, j === 0, j === 0));
                }
                break;
            }
        }
    }
    function getTaken(date) {
        for (var i = 0; i < dates.length; i++) {
            if (dates[i].date === date){
                currentPrice=dates[i].price;
                return dates[i].taken;
            }
        }
    }

    function check(j, taken) {
        if(taken) {
            for (var i = 0; i < taken.length; i++) {
                if (taken[i] === j) return true;
            }
        }
        return false;
    }

    var $flight = $("#flight");
    var date = document.getElementById("date");
    var $price=$("#price");
    var currentPrice=0;

    $flight.change(function () {
        count=0;
        changeFlight();
    });

    $("#date").change(function(){
        count=0;
        changeDate();
    });

    var plane = document.getElementById('scheme');

    $logo.mouseover(function () {
        $logo.prop("src", "images/Logo.gif");
    });
    $logo.mouseout(function () {
        $logo.prop("src", "images/Logo2.png");
    });
    $logo.click(function () {
        location.reload();
    });
    $("#mainPage").click(function () {
        location.reload();
    });

    $(".close").click(function () {
        $(".widget").removeClass("enabled");
        count=0;
        window.setTimeout(function(){
            $(".widget").hide();
            $("#background").hide();
        }, 300);
    });

    function changeFlight() {
        var bool, flight, date;
        for (var i = 210, n = 0; i <= 740; i += 50) {
            for (var j = 585; j <= 810; j += 70) {
                flight=$flight.find(":selected").val();
                fillDates(flight);
                date=$("#date").find(":selected").val();
                bool = check(n, getTaken(date));
                sits[n++] = {
                    x: j,
                    y: i,
                    w: 60,
                    h: 40,
                    br: 6,
                    taken: bool,
                    marked: false
                };
                if (j === 655) j += 15;
            }
            if (i === 530 || i === 360) i += 20;
        }
        redraw();
        updatePrice();
    }

    function changeDate(){
        var bool, date;
        for (var i = 210, n = 0; i <= 740; i += 50) {
            for (var j = 585; j <= 810; j += 70) {
                date=$("#date").find(":selected").val();
                bool = check(n, getTaken(date));
                sits[n++] = {
                    x: j,
                    y: i,
                    w: 60,
                    h: 40,
                    br: 6,
                    taken: bool,
                    marked: false
                };
                if (j === 655) j += 15;
            }
            if (i === 530 || i === 360) i += 20;
        }
        redraw();
        updatePrice();
    }

    $("#oBook").click(function () {
        $("#book").show();
        window.setTimeout(function(){
            $("#book").addClass('enabled');
        }, 1);
        $("#background").show();
        context = canvas.getContext('2d');
        changeFlight();
    });

    var mousePos;
    window.onmousemove = function (event) {
        mousePos = getMousePos(canvas, event);
    };

    window.setInterval(function () {
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            redraw();
            for (var k = 0; k < sits.length; k++) {
                if (mousePos.x >= sits[k].x && mousePos.x <= sits[k].x + sits[k].w && mousePos.y >= sits[k].y && mousePos.y <= sits[k].y + sits[k].h && !sits[k].taken && !sits[k].marked) {
                    context.fillStyle = 'lightgray';
                    context.roundRect(sits[k].x, sits[k].y, sits[k].w, sits[k].h, sits[k].br).fill();
                    break;
                }
            }
        }
    }, 60);

    $(canvas).click(function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
        redraw();
        for (var k = 0; k < sits.length; k++) {
            if (mousePos.x >= sits[k].x && mousePos.x <= sits[k].x + sits[k].w && mousePos.y >= sits[k].y && mousePos.y <= sits[k].y + sits[k].h && !sits[k].taken) {
                if (!sits[k].marked){
                    context.fillStyle = 'gray';
                    count++;
                }
                else {
                    context.fillStyle = 'lightgray';
                    count--;
                }
                sits[k].marked = !sits[k].marked;
                context.roundRect(sits[k].x, sits[k].y, sits[k].w, sits[k].h, sits[k].br).fill();
                break;
            }
        }
        updatePrice();
    });


    function updatePrice(){
        $price.text(count*currentPrice*25+" грн");
    }
    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect(), // abs. size of element
            scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
            scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

        return {
            x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
            y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
        }
    }

    function redraw() {
        if(context) {
            context.drawImage(plane, -600, 0, 2650, 1200);
            for (var i = 0; i < sits.length; i++) {
                if (sits[i].marked) context.fillStyle = 'gray';
                if (sits[i].taken) context.fillStyle = 'black';
                context.roundRect(sits[i].x, sits[i].y, sits[i].w, sits[i].h, sits[i].br).stroke();
                if (sits[i].taken || sits[i].marked) context.roundRect(sits[i].x, sits[i].y, sits[i].w, sits[i].h, sits[i].br).fill();
            }
        }
    }

    $("#oPhone").click(function () {
        $("#phone").show();
        window.setTimeout(function(){
            $("#phone").addClass('enabled');
        }, 1);
        $("#background").show();
    });

    $("#oComplain").click(function () {
        $("#complain").show();
        window.setTimeout(function(){
            $("#complain").addClass('enabled');
            }, 1);
        $("#background").show();
    });

    $("#infoPage").click(function () {
        $("#details").show();
        window.setTimeout(function(){
            $("#details").addClass('enabled');
        }, 1);
        $("#background").show();
    });
    $("#contactPage").click(function () {
        $("#contact").show();
        window.setTimeout(function(){
            $("#contact").addClass('enabled');
        }, 1);
        $("#background").show();
        GoogleMap.init();
    });
    $("#servicePage").click(function () {
        $("#service").show();
        window.setTimeout(function(){
            $("#service").addClass('enabled');
        }, 1);
        $("#background").show();
    });

    $("#order").click(function(){
        event.preventDefault();
        var suc=true;
        var $client=$("#client");
        var $clientPhone=$("#tel");
        var $clientMail=$("#mail");
        var $clientAddress=$("#address");

        var name = $client.val();
        if(name===""){
            $client.css("box-shadow", "0 0 3px #CC0000");
            suc=false;
        }
        else $client.css("box-shadow", "0 0 3px #006600");

        var phone = $clientPhone.val();
        if(phone==="" || (phone.charAt(0)==='+' && phone.length<13) || (phone.charAt(0)==='0' && phone.length<10)){
            $clientPhone.css("box-shadow", "0 0 3px #CC0000");
            suc=false;
        }
        else $clientPhone.css("box-shadow", "0 0 3px #006600");

        var mail = $clientMail.val();
        if(mail===""){
            $clientMail.css("box-shadow", "0 0 3px #CC0000");
            suc=false;
        }
        else $clientMail.css("box-shadow", "0 0 3px #006600");

        var address = $clientAddress.val();
        if(address===""){
            $clientAddress.css("box-shadow", "0 0 3px #CC0000");
            suc=false;
        }
        else $clientAddress.css("box-shadow", "0 0 3px #006600");

        if(suc) {
            var order_info = {
                name: name,
                phone: phone,
                address: address,
                email: mail,
                cost: parseInt($("#price").text().split(" ")[0]),
                flight:""
            };
            API.createOrder(order_info, function (error, data) {
                if (error) alert(error);
                else {
                    window.LiqPayCheckoutCallback=Pay.create(data.data, data.signature);
                }
            });

        }
    });

    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
});
},{"./API":1,"./googleMaps":2,"./payment":4}],4:[function(require,module,exports){

var create = function (data, signature) {
    var suc;
    LiqPayCheckout.init({
        data: data,
        signature: signature,
        embedTo: "#liqpay",
        mode: "popup"
    }).on("liqpay.callback", function (data) {
        console.log(data.status);
        console.log(data);
        suc=data.result==="success";
    }).on("liqpay.ready", function (data) {
//	ready
    }).on("liqpay.close", function (data) {
//	close
        if(suc) {
            alert("Транзакція успішна!\n    Дякуємо за купівлю!:)");
            window.location.href = '/';
        }
    });
};

exports.create=create;
},{}]},{},[3]);
