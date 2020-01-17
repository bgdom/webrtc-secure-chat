const URL = "http://localhost:3000"
let chat
let usernameGlobal

function handleChannelStatusChange(event){
  switchToSession()
}

function onMessageReceived(data){
  $("#text_area").append($("<p></p>").text(data))
}
function sendMessage(){
  const data = $("#msg").val()
  $("#text_area").append("<p>"+data+"</p>")
  chat.send(data)
}

function receiveChannelCallback({channel}){
  chat = channel

  chat.onopen = handleChannelStatusChange;
  chat.onclose = handleChannelStatusChange;

  chat.onmessage = ({data}) => onMessageReceived(data)
}

function setupConnection(role){
  const configuration = {iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302']
    },{
      urls: ['stun:stun.voipplanet.nl:3478']
    }
  ]};

  const connection = new RTCPeerConnection(configuration);
  connection.onicecandidate = (event) => {
    event.candidate && 
    socket.emit('ice', {candidate: event.candidate});
  }

  socket.on('ice', function(data){
    connection.addIceCandidate(data.candidate)
  })

  if(role === 'offer'){
    chat = connection.createDataChannel("chat");
    receiveChannelCallback({channel: chat})

    connection.createOffer()
      .then(offer => {
        offer &&
        connection.setLocalDescription(offer)
          .then(() => socket.emit('offer', {offer: offer}))
      })

      socket.on('answer', function(data){
        connection.setRemoteDescription(data.answer)
      })
  }else{
    connection.ondatachannel = receiveChannelCallback;
    socket.on('offer', function(data){
      connection.setRemoteDescription(data.offer)
        .then(() => connection.createAnswer())
        .then(answer => answer && connection.setLocalDescription(answer)
          .then(() => socket.emit('answer', {answer: answer})))
    })
  }
}

function tryStartingSession(user){
  socket.emit('talk', {username: user})
}

function setupSocket(socket){
  socket.on('connect_request', function(data){
    if(data.status !== "success")
      alert('Error while connecting: '+ data.details)
    else
      socket.username = data.username
  })

  socket.on('talk', function(data) {
    const { status } = data;
    if(status === 'error'){
      alert(data.details);
      return
    } 

    setupConnection(data.role)
  })
}

let intervalId = undefined
async function refreshUserList(){
  const begDate = Date.now()
  let users = await getConnectedUsers()
  users = users.filter(user => user !== usernameGlobal)
  
  let delay = begDate - Date.now()
  delay = delay < 3000 ? 3000 - delay : 0

  const lus = $("#list-users-lu")
  lus.empty()

  const tab = []
  for(user of users){
    const line = $("<li></li>")
    const alink = $("<a></a>").text(user)
    line.append(alink)
    line.click(() => tryStartingSession(user))

    tab.push(line)
  }

  lus.append(tab)

  setTimeout(refreshUserList, delay)
}

function getConnectedUsers(){
  return $.get(URL+"/listConnectedUsers")
}

// function openSession(){
//   onConnect()
//   tryConnection()
// }

let socket
$(function(){
  socket = io.connect(URL);
  setupSocket(socket)

  // nouvel id: session_btn a la place de username1_btn et username2_btn
  
  $("#username1_btn").click(tryConnection)
  $('#username1_btn').click(function() {
    // $('.intro').addClass('wow bounceOut')
    $('.intro').css('visibility', 'hidden')
    $('.users').css('visibility', 'visible')
})
  $("#get-session-btn").click(tryStartingSession)
  $("#send_btn").click(sendMessage)

  refreshUserList()
})

function tryConnection(){
  socket.emit('connect_request', {username: usernameGlobal = $("#username1").val()})
}