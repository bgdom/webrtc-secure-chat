const express = require('express')
const http = require('http')
const app = express()

app.use('/', express.static('public', {
    maxAge: 0
}));

const server = http.createServer(app)

const io = require('socket.io').listen(server)
const sockets = []
const mapSocketFriend = {}

io.sockets.on('connection', function(socket){
  console.log('user connected');
  sockets.push(socket)

  socket.on('disconnect', function() {
    console.log('user disconnected');

    const i = sockets.indexOf(socket);
    sockets.splice(i, 1);
    if(!sockets.username || !mapSocketFriend[socket.username]) return

    const friend = mapSocketFriend[socket.username]
    delete mapSocketFriend[socket.username]
    delete mapSocketFriend[friend.username]
  });

  // handle connection (identification request)
  socket.on('connect_request', function(data){
    console.log("connection request ");
    
    const { username } = data
    const res = sockets.filter(s => s.username && s.username === username)
    // if user already has username -> error
    if(socket.username)
      socket.emit('connect_request', {status: 'error', details: 'you already have a username: '+socket.username})
    // if username doesn't exist, connect 
    else if(res.length === 0){
      socket.username = username
      socket.emit('connect_request', {status: 'success'})
    }
    // if username already exists -> error
    else
      socket.emit('connect_request', {status: 'error', details: username+' username already exists'})
  })

  socket.on('talk', function(data){
    const { username } = data
    const res = sockets.filter(s => s.username && s.username === username)
    if(res.length === 0){
      socket.emit('talk', {status: 'error', details: username + " not connected"})
      return
    }else if(socket.username === username){
      socket.emit('talk', {status: 'error', details: "You cannot talk to yourself !"})
      return
    }

    mapSocketFriend[username] = socket
    mapSocketFriend[socket.username] = res[0]

    socket.emit('talk', {status: 'success', username: username, role: 'offer'})
    res[0].emit('talk', {status: 'success', username: socket.username, role: 'answer'})
  })

  socket.on('ice', function(data){
    const { candidate } = data
    const friend = mapSocketFriend[socket.username]
    friend.emit('ice', {candidate: candidate})
  })

  socket.on('offer', function(data){
    const { offer } = data
    const friend = mapSocketFriend[socket.username]
    if(friend.hasOffer) return
    friend.hasOffer = true

    console.log(offer)
    friend.emit('offer', {offer: offer})
  })

  socket.on('answer', function(data){
    const { answer } = data
    const friend = mapSocketFriend[socket.username]
    if(friend.hasAnswer) return
    friend.hasAnswer = true
    
    friend.emit('answer', {answer: answer})
  })
})

server.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})