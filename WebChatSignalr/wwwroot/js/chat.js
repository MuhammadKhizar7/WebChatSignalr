"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

//Disable send button until connection is established
document.getElementById("sendButton").disabled = true;
document.getElementById("messageInput").disabled = true;

connection.on("ReceiveMessage", function (userId, message, timestamp) {
    console.log(userId, message, timestamp);
    var msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    console.log(userId === document.getElementById("Conversation_Sender_Id").value);
    var time = timestamp;
    var name = '';
    var avatar='';
    if (userId === document.getElementById("Conversation_Sender_Id").value) {
        name = document.getElementById("Conversation_Sender_Name").value;
        avatar = document.getElementById("Conversation_Sender_Avatar").value;
    } else {
        name = document.getElementById("Conversation_Recipient_Name").value;
        avatar = document.getElementById("Conversation_Recipient_Avatar").value;
    }
    console.log(name, avatar, time);
    var encodedMsg = `<li>
                        <div class="media p-2">
                            <div class="profile-avatar mr-2">
                                <img class="avatar-img" src="${avatar}" alt="${name}">
                            </div>

                            <div class="media-body overflow-hidden">
                                <div class="d-flex mb-1">
                                    <h6 class="text-truncate mb-0 mr-auto">${name}</h6>
                                    <p class="small text-muted text-nowrap ml-4">${time}</p>
                                </div>
                                <div class="text-wrap text-break">${msg}</div>
                            </div>
                        </div>
                    </li>`;
    var li = document.createElement("li");
    li.innerHTML = encodedMsg;
    document.getElementById("messagesList").appendChild(li);
});

connection.start().then(function () {
    document.getElementById("sendButton").disabled = false;
    document.getElementById("messageInput").disabled = false;
    var roomId = document.getElementById("conversationInput").value;
    connection.invoke("JoinRoom", roomId).catch(function (err) {
       
        return console.error(err.toString());
    });
}).catch(function (err) {
    return console.error(err.toString());
});

document.getElementById("sendButton").addEventListener("click", function (event) {
    var userId = document.getElementById("userInput").value;
    var message = document.getElementById("messageInput").value;
    var conversationId = document.getElementById("conversationInput").value;
    console.log(conversationId,userId, message);
    connection.invoke("SendMessage",conversationId, userId, message).catch(function (err) {
       
        return console.error(err.toString());
    });
    event.preventDefault();
    document.getElementById("messageInput").value = '';
});