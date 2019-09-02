var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
    res.sendfile('app.html');
});

var connectedSockets={};
var allUsers=[{nickname:"",color:"#000",channel:''}];//The initial value contains "group chat" and "" means nickname
io.on('connection',function(socket) {


    socket.on('addUser', function (data) { //There are new users entering the chat room
        if (connectedSockets[data.nickname]) {//Nickname is already occupied
            socket.emit('userAddingResult', {result: false});
        } else {
            socket.emit('userAddingResult', {result: true});
            socket.nickname = data.nickname;
            socket.channel = data.channel;
            connectedSockets[socket.nickname] = socket;//Save each socket instance and send a private message
            allUsers.push(data);
            socket.broadcast.emit('userAdded', data);//Broadcast welcomes new users, except for new users
            socket.emit('allUser', allUsers);//Send all online users to new users
        }

    });

    socket.on('addMessage', function (data) { //A user sends a new message
        if (data.to) {//发给特定用户
            connectedSockets[data.to].emit('messageAdded', data);
        } else {//群发
            socket.broadcast.emit('messageAdded', data);//Broadcast messages, except for the original sender
        }


    });

    socket.on('disconnect', function () {  //There is a user exiting the chat room
        socket.broadcast.emit('userRemoved', {  //Broadcast has user exit
            nickname: socket.nickname
        });
        for (var i = 0; i < allUsers.length; i++) {
            if (allUsers[i].nickname == socket.nickname) {
                allUsers.splice(i, 1);
            }
        }
        delete connectedSockets[socket.nickname]; //Delete the corresponding socket instance

    });

    socket.on('list', function (data) {
        var str = JSON.stringify(data);//Because the nodejs write file only recognizes strings or binary numbers, convert the json object into a string and rewrite it into the json file.
        fs.writeFile('data.json', str, function (err) {
            if (err) {
                console.error(err);
            }
            console.log('----------added successfully-------------');
        })

    });

    socket.on('li', function (data) {
        fs.readFile('data.json', function (err, data) {
            if (err) {
                return console.error(err);
            }
            var sss = data.toString();//Convert binary data to a string

            socket.emit('lis', sss);//Send all online users to new users
        });
    });
})

http.listen(3000, function () {
    console.log('listening on *:3000');
});