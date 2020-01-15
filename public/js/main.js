const URL = "http://localhost:3000"
let chat

function onConnect(){
  const RSAkey = cryptico.generateRSAKey("", 2048);
  const PublicKeyString = cryptico.publicKeyString(RSAkey);       
  socket.emit('connect_request', {username: $("#username1").val(), "pub_key": PublicKeyString})
}

function handleChannelStatusChange(event){
  console.log(event);
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

function tryConnection(){
  socket.emit('talk', {username: $("#username2").val()})
}

function setupSocket(socket){
  socket.on('connect_request', function(data){
    if(data.status === "success")
      alert('Successfuly connected')
    else      
      alert('Error while connecting: '+ data.details)
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
  
  $("#username1_btn").click(onConnect)
  $("#username2_btn").click(tryConnection)
  $("#msg_btn").click(sendMessage)
})