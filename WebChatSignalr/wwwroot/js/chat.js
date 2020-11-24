"use strict";

const connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

//Disable send button until connection is established
document.getElementById("sendButton").disabled = true;
document.getElementById("messageInput").disabled = true;

connection.on("ReceiveMessage", function (userId, message, timestamp) {
    console.log(userId, message, timestamp);
    let msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    console.log(userId === document.getElementById("Conversation_Sender_Id").value);
    let time = timeago(new Date()-new Date(timestamp));
    let name,avatar='';
    if (userId === document.getElementById("Conversation_Sender_Id").value) {
        name = document.getElementById("Conversation_Sender_Name").value;
        avatar = document.getElementById("Conversation_Sender_Avatar").value;
    } else {
        name = document.getElementById("Conversation_Recipient_Name").value;
        avatar = document.getElementById("Conversation_Recipient_Avatar").value;
    }
    console.log(name, avatar, time);
    let encodedMsg = `<li>
                        <div class="media p-2">
                            <div class="profile-avatar mr-2">
                                <img class="avatar-img" src="${avatar}" alt="${name}">
                            </div>

                            <div class="media-body overflow-hidden">
                                <div class="d-flex mb-1">
                                    <h6 class="text-truncate mb-0 mr-auto">${name}</h6>
                                    <p class="small text-muted text-nowrap ml-4">${time}</p>
                                </div>
                                <div class="text-wrap text-break" >${msg}</div>
                            </div>
                        </div>
                    </li>`;
    let li = document.createElement("li");
    li.innerHTML = encodedMsg;
    document.getElementById("messagesList").appendChild(li);
});

connection.on("onError", function (message) {
    console.log(message);
});

function showNotification(roomId, message) {
    let roomEl = document.querySelector("li[data-roomId='" + roomId + "']");
//    console.log(roomEl);
    if (roomEl) {
        let unread = roomEl.querySelector(".unread-count");
//        console.log(unread !== null);
        if (unread) {
            let count =parseInt(unread.textContent);
            count++;
            unread.textContent = count;
            roomEl.querySelector(".last-msg").innerText = message;
            roomEl.querySelector(".last-updated").innerText = timeago(new Date()-new Date());
        } else {
            console.log("unread is null");
            roomEl.querySelector(".last-msg").innerText = message;
            roomEl.querySelector(".last-updated").innerText = timeago(new Date()-new Date());
            let elStr ='<div class="badge badge-circle badge-primary badge-border-light badge-top-right"><span>1</span></div>';
            let div = document.createElement('div');
            div.innerHTML = elStr;
            console.log(div);
            roomEl.appendChild(div);
        }
    }
}
connection.on("Notification", function (roomId,message) {
    console.log(roomId, message);
    showNotification(roomId, message);
});
connection.start().then(function () {
    document.getElementById("sendButton").disabled = false;
    document.getElementById("messageInput").disabled = false;
    const roomId = document.getElementById("conversationInput").value;
    connection.invoke("JoinRoom", roomId).catch(function (err) {
       
        return console.error(err.toString());
    });
}).catch(function (err) {
    return console.error(err.toString());
});

document.getElementById("sendButton").addEventListener("click", function (event) {
    sendMessage();
    event.preventDefault();
});
document.getElementById("messageInput").addEventListener("click", function (event) {
    readMessage();
    event.preventDefault();
});
document.getElementById("messageInput").addEventListener("keydown", function(event) {
    if (event.keyCode === 13 && event.ctrlKey) {
        const textarea = document.querySelector('#messageInput');
        textarea.value = textarea.value + "\r\n";
    }
    if (event.key === "Enter") {
        event.preventDefault();
        // Do more work
        sendMessage();
    }
});

function sendMessage() {
    const userId = document.getElementById("userInput").value;
    const message = document.getElementById("messageInput").value;
    const conversationId = document.getElementById("conversationInput").value;
    console.log(conversationId,userId, message);
    connection.invoke("SendMessage",conversationId, userId, message).catch(function (err) {
       
        return console.error(err.toString());
    });
    document.getElementById("messageInput").value = '';
}

function readMessage() {
    let unread = document.querySelector(".user-link.active").querySelector(".unread-count");
    if (unread) {
        console.log("clicked");
        const conversationId = document.getElementById("conversationInput").value;
        const options = {
            method: 'PUT',
            body: conversationId,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        }
        Ajax.makeRequest('/Chat/ReadMessage', options)
            .then((data) => {
                console.log(data)
                if (data.response) {
                    unread.remove();
                }
            })
            .catch((error) => {
                console.log(error)

            })
    }


}


var Ajax = {
    makeRequest: function (url, options) {
        return new Promise((resolve, reject) => {
            fetch(url, options)
                .then(this.handleResponse)
                .then((response) => JSON.parse(response))
                .then((json) => resolve(json))
                .catch(this.handleError)
                .catch((error) => {
                    try {
                        reject(JSON.parse(error))
                    } catch (e) {
                        reject(error)
                    }
                })
        })
    },
    handleResponse: function (response) {
        return response.json().then((json) => {
            // Modify response to include status ok, success, and status text
            let modifiedJson = {
                success: response.ok,
                status: response.status,
                statusText: response.statusText
                    ? response.statusText
                    : json.error || '',
                response: json,
            }
            // If request failed, reject and return modified json string as error
            if (!modifiedJson.success)
                return Promise.reject(JSON.stringify(modifiedJson))
            // If successful, continue by returning modified json string
            return JSON.stringify(modifiedJson)
        })
    },
    handleError: function (errorRes) {
        const errorResponse = JSON.parse(JSON.stringify(errorRes))
        const responseError = {
            type: 'Error',
            message:
                errorResponse.message ||
                    errorResponse.response.message ||
            'Something went wrong',
            data: errorResponse.response || '',
            code: errorResponse.status || '',
        }
        let error = new Error()
        error = { ...error, ...responseError }
        console.log(error)
        throw error
    },
}