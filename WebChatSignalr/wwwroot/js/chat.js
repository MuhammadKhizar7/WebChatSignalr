"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

//Disable send button until connection is established
document.getElementById("sendButton").disabled = true;
document.getElementById("messageInput").disabled = true;

connection.on("ReceiveMessage", function (user, message) {
    var msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var time = "12:00:00 am";
    var senderName = document.getElementById("Conversation_Sender_Name").value;
    var senderAvatar = document.getElementById("Conversation_Sender_Avatar").value;
    var encodedMsg = `<li>
                        <div class="media p-2">
                            <div class="profile-avatar mr-2">
                                <img class="avatar-img" src="${senderAvatar}" alt="${senderName}">
                            </div>

                            <div class="media-body overflow-hidden">
                                <div class="d-flex mb-1">
                                    <h6 class="text-truncate mb-0 mr-auto">${senderName}</h6>
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
}).catch(function (err) {
    return console.error(err.toString());
});

document.getElementById("sendButton").addEventListener("click", function (event) {
    var user = document.getElementById("userInput").value;
    var message = document.getElementById("messageInput").value;
    connection.invoke("SendMessage", user, message).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
});