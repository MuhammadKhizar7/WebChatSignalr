'use strict'

var Chat = {
  el: {
    connection: new signalR.HubConnectionBuilder()
      .withUrl('/chatHub')
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build(),
    roomId: document.getElementById('conversationInput'),
    messagesList: document.getElementById('messagesList'),
    sendButton: document.getElementById('sendButton'),
    messageInput: document.getElementById('messageInput'),
    senderId: document.getElementById('Conversation_Sender_Id'),
    senderName: document.getElementById('Conversation_Sender_Name'),
    senderAvatar: document.getElementById('Conversation_Sender_Avatar'),
    recipientName: document.getElementById('Conversation_Recipient_Name'),
    recipientAvatar: document.getElementById('Conversation_Recipient_Avatar'),
    activeUserOnlist: document.querySelector('.user-link.active'),
    userId: document.getElementById('userInput'),
    excerpt: document.querySelector('.user-link.active .message'), // highlight message on user list
    emojiLinks: document.getElementsByClassName('emoji-link'),
    closeChatbox: document.getElementById('close-chat'),
  },
  init: function () {
    let con = Chat.el.connection
    con.on('ReceiveMessage', function (userId, message, timestamp) {
      Chat.renderMessage(userId, message, timestamp, function (li) {
        Chat.el.messagesList.appendChild(li)
      })
    })

    con.on('onError', function (message) {
      console.log(message)
    })

    con.on('Notification', function (roomId, message) {
      Chat.showNotification(roomId, message)
    })

    con
      .start()
      .then(function () {
        con.invoke('JoinRoom', Chat.el.roomId.value).catch(function (err) {
          return console.error(err.toString())
        })
      })
      .catch(function (err) {
        return console.error(err.toString())
      })

    Chat.el.sendButton.addEventListener('click', function (event) {
      Chat.sendMessage()
      event.preventDefault()
    })
    Chat.el.messageInput.addEventListener('click', function (event) {
      Chat.readMessage()
      event.preventDefault()
    })
    Chat.el.messageInput.addEventListener('input', function (event) {
      let unread = Chat.el.activeUserOnlist.querySelector('.unread-count')
      if (unread) {
        Chat.readMessage()
      }
      event.preventDefault()
    })
    Chat.el.messageInput.addEventListener('keydown', function (event) {
      if (event.keyCode === 13 && event.ctrlKey) {
        const textarea = Chat.el.messageInput
        textarea.value = textarea.value + '\r\n'
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        // Do more work
        Chat.sendMessage()
      }
    })
    Chat.el.closeChatbox.addEventListener('click', function (event) {
      Chat.hideChatBox()
      event.preventDefault()
    })
    Chat.el.activeUserOnlist.addEventListener('click', function (event) {
      Chat.hideUserListOnMobile()
      event.preventDefault()
    })
    Chat.hideUserListOnMobile()
    Chat.loadHistoryMessage()
    Chat.renderEmoji()
    Chat.blockUserDropdown()
    Chat.UiEmoji()
  },
  sendMessage: function () {
    const userId = Chat.el.userId.value
    let message = Chat.el.messageInput.value
    const conversationId = Chat.el.roomId.value
    message = message.trim()
    if (message) {
      Chat.el.connection
        .invoke('SendMessage', conversationId, userId, message)
        .then(function () {
          Chat.el.excerpt.innerHTML = Chat.BasicEmojis.parseEmojis(message)
        })
        .catch(function (err) {
          return console.error(err.toString())
        })
    }
    Chat.el.messageInput.value = ''
  },
  readMessage: function () {
    let unread = document
      .querySelector('.user-link.active')
      .querySelector('.unread-count')
    if (unread) {
      const options = {
        method: 'PUT',
        body: Chat.el.roomId.value,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
      Ajax.makeRequest('/Chat/ReadMessage', options)
        .then((data) => {
          if (data.response) {
            unread.remove()
          }
        })
        .catch((error) => {
          console.log(error)
        })
    }
  },
  renderMessage: function (userId, message, timestamp, callback) {
    let time = window.timeago(new Date() - new Date(timestamp))
    let name, avatar
    if (userId === +Chat.el.senderId.value) {
      name = Chat.el.senderName.value
      avatar = Chat.el.senderAvatar.value
    } else {
      name = Chat.el.recipientName.value
      avatar = Chat.el.recipientAvatar.value
    }
    let parsedMessage = Chat.BasicEmojis.parseEmojis(message)
    let encodedMsg = `<li>
                        <div class="media p-2">
                            <div class="profile-avatar mr-2">
                                <img class="avatar-img" src="/images/${avatar}" >
                            </div>

                            <div class="media-body overflow-hidden">
                                <div class="d-flex mb-1">
                                    <h6 class="text-truncate mb-0 mr-auto">${name}</h6>
                                    <p class="small text-muted text-nowrap ml-4">${time}</p>
                                </div>
                                <div class="text-wrap text-break p-1" >${parsedMessage}</div>
                            </div>
                        </div>
                    </li>`
    let li = document.createElement('li')
    li.innerHTML = encodedMsg
    callback(li)
  },
  renderEmoji: function () {
    window.onload = function () {
      let messages = document.getElementsByClassName('message')
      for (let message of messages) {
        message.innerHTML = Chat.BasicEmojis.parseEmojis(message.innerText)
      }
    }
  },
  UiEmoji: function () {
    const emojiLinks = Chat.el.emojiLinks
    for (let item of emojiLinks) {
      item.addEventListener('click', function (event) {
        event.preventDefault()
        let input = Chat.el.messageInput
        if (input.selectionStart || input.selectionStart === 0) {
          Chat.el.messageInput.value = [
            input.value.slice(0, input.selectionStart),
            item.firstElementChild.value,
            input.value.slice(input.selectionEnd),
          ].join('')
        }
      })
    }
  },
  ExcerptEmoji: function () {
    console.log(Chat.el.excerpt.textContent)
    if (Chat.el.excerpt.textContent) {
      Chat.el.excerpt.innerHTML = Chat.BasicEmojis.parseEmojis(
        Chat.el.excerpt.textContent
      )
    }
  },
  BasicEmojis: {
    parseEmojis: function (content) {
      // content = `<span>${content}</span>`;
      content = content.replace(/(:\))/g, this.addImage('emoji1.png'))
      // content = content.replace(":)", this.addImage("emoji1.png"));
      content = content.replace(/(:[P])/g, this.addImage('emoji2.png'))
      // content = content.replace(":P", this.addImage("emoji2.png"));
      content = content.replace(/(:[O])/g, this.addImage('emoji3.png'))
      // content = content.replace(":O", this.addImage("emoji3.png"));
      content = content.replace(/(:[\-]+\))/g, this.addImage('emoji4.png'))
      // content = content.replace(":-)", this.addImage("emoji4.png"));
      content = content.replace(/(B\|)/g, this.addImage('emoji5.png'))
      // content = content.replace("B|", this.addImage("emoji5.png"));
      content = content.replace(/(:[D])/g, this.addImage('emoji6.png'))
      // content = content.replace(":D", this.addImage("emoji6.png"));
      content = content.replace(/(<3)/g, this.addImage('emoji7.png'))
      // content = content.replace("<3", this.addImage("emoji7.png"));
      return content
    },
    addImage: function (imageName) {
      return `<img class="emoji" alt="emoji" src="/images/emojis/${imageName}">`
    },
  },
  showNotification: function (roomId, message) {
    let roomEl = document.querySelector("li[data-roomId='" + roomId + "']")
    if (roomEl) {
      let unread = roomEl.querySelector('.unread-count')
      if (unread) {
        let count = parseInt(unread.textContent)
        count++
        unread.textContent = count
        roomEl.querySelector('.last-msg').innerText = message
        roomEl.querySelector('.last-updated').innerText = window.timeago(
          new Date() - new Date()
        )
        Chat.ExcerptEmoji()
      } else {
        roomEl.querySelector('.last-msg').innerText = message
        roomEl.querySelector('.last-updated').innerText = window.timeago(
          new Date() - new Date()
        )
        let elStr =
          '<div class="badge badge-circle badge-primary badge-border-light badge-top-right unread-count"><span>1</span></div>'
        let div = document.createElement('div')
        div.innerHTML = elStr
        roomEl.appendChild(div)
        Chat.ExcerptEmoji()
      }
    } else {
      Chat.newShowNotification(roomId, message)
    }
  },
  newShowNotification: function (roomId, message) {
    const options = {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
    let url = '/Chat/GetChatUser/' + roomId
    Ajax.makeRequest(url, options).then((data) => {
      console.log(data.response)
      if (data.response) {
        let { id, name, avatar } = data.response
        let notification = `<li class="list-group-item list-group-item-action user-link " data-roomid="${roomId}" data-userid="${id}">
                               <a class="position-absolute inset-0 " href="/Chat/${id}"> </a>
                               <div class="media">
                                   <div class="profile-avatar mr-2">
                                       <img class="avatar-img" src="/images/${avatar}" >
                                   </div>
                                   <div class="media-body overflow-hidden">
                                       <div class="d-flex mb-1">
                                           <h6 class="text-truncate mb-0 mr-auto username">${name}</h6>
                                           <p class="small text-nowrap last-updated" datetime="${new Date()}">${window.timeago(
          new Date() - new Date()
        )}</p>
                                       </div>
                                       <div class="text-truncate last-msg p-1 message">${message}</div>
                                   </div>
                               </div>
                                <div class="badge badge-circle badge-primary badge-border-light badge-top-right unread-count"><span>1</span></div>
                           </li>`
        console.log(notification)
        document
          .querySelector('.user-list > .list-group')
          .insertAdjacentHTML('afterbegin', notification)
      }
    })
    Chat.ExcerptEmoji()
  },
  loadHistoryMessage: function () {
    let timer
    document.getElementsByClassName('chat-box')[0].addEventListener(
      'scroll',
      function () {
        const load = document.getElementById('load-more')
        if (timer) {
          clearTimeout(timer)
        }
        timer = setTimeout(() => {
          if (Utils.isInViewPort(load)) {
            // // update the element display
            // console.log('in viewport')
            const currentPage = document.getElementById(
              'Conversation_Messages_CurrentPage'
            ).value
            const pageCount = document.getElementById(
              'Conversation_Messages_PageCount'
            ).value
            const conversationId =
              document.getElementById('conversationInput').value
            if (currentPage !== pageCount) {
              const url = `${
                window.location.origin
              }/Chat/LoadHistory/${conversationId}?page=${+currentPage + 1}`
              const options = {
                method: 'Get',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
              }
              Ajax.makeRequest(url, options)
                .then((data) => {
                  if (data.response || data.response.results.length > 0) {
                    data.response.results.forEach((x) => {
                      renderMessage(
                        x.senderId,
                        x.content,
                        x.timestamp,
                        function (li) {
                          insertAfter(li, document.getElementById('load-more'))
                        }
                      )
                    })
                    document.getElementById(
                      'Conversation_Messages_CurrentPage'
                    ).value = data.response.currentPage
                  }
                })
                .catch((error) => {
                  console.log(error)
                })
            }
          }
        }, 1000)
      },
      false
    )
  },
  blockUser: function (el, status) {
    const roomId = document.getElementById('conversationInput').value
    let url =
      status === 'block'
        ? '/Chat/BlockUser/' + roomId
        : '/Chat/BlockUser/' + roomId + '?isReported=true'
    const options = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
    Ajax.makeRequest(url, options)
      .then((data) => {
        if (data.response) {
          if (data.response.success) {
            document.getElementById('sendButton').disabled = false
            document.getElementById('messageInput').disabled = false
            document.getElementById('chatIcon').disabled = false
            document.getElementById('chat-blocker').classList.toggle('d-none')
            document
              .getElementById('chat-box')
              .classList.replace('overflow-hidden', 'overflow-auto')
            if (status === 'block') {
              el.textContent = '🚫 Unblock User'
            } else {
              el.textContent = '☣️ Remove Report'
            }
          }
        }
      })
      .catch((error) => {
        console.log(error)
      })
  },
  blockUserDropdown: function () {
    const chatDropLinks = document.querySelectorAll('#chat-dropdown a')
    for (let link of chatDropLinks) {
      link.addEventListener('click', function (e) {
        e.preventDefault() // cancel the link behaviour
        const el = e.target
        el.textContent === '🚫 Block User'
          ? Chat.blockUser(el, 'block')
          : Chat.blockUser(el, 'report')
      })
    }
  },
  isMoblile: function () {
    return window.matchMedia('only screen and (max-width: 760px)').matches
  },
  hideUserListOnMobile: function () {
    if (this.isMoblile && window.location.pathname.split('/')[2].length) {
      document
        .getElementsByClassName('chat-area')[0]
        .classList.add('chat-visible')
    } else {
      document
        .getElementsByClassName('chat-area')[0]
        .classList.remove('chat-visible')
    }
  },
  hideChatBox: function () {
    document
      .getElementsByClassName('chat-area')[0]
      .classList.remove('chat-visible')
  },
}

Chat.init()

const Ajax = {
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

var Utils = {
  isInViewPort: function (element) {
    // Get the bounding client rectangle position in the viewport
    const bounding = element.getBoundingClientRect()

    // Checking part. Here the code checks if it's *fully* visible
    // Edit this part if you just want a partial visibility
    return (
      bounding.top >= 0 &&
      bounding.left >= 0 &&
      bounding.right <=
        (window.innerWidth || document.documentElement.clientWidth) &&
      bounding.bottom <=
        (window.innerHeight || document.documentElement.clientHeight)
    )
  },

  insertAfter: function (newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
  },
}

//const connection = new signalR.HubConnectionBuilder()
//  .withUrl('/chatHub')
//  .withAutomaticReconnect()
//  .configureLogging(signalR.LogLevel.Information)
//  .build()
//
//connection.on('ReceiveMessage', function (userId, message, timestamp) {
//  renderMessage(userId, message, timestamp, function (li) {
//    document.getElementById('messagesList').appendChild(li)
//  })
//})
//
//connection.on('onError', function (message) {
//  console.log(message)
//})
//
//function showNotification(roomId, message) {
//  let roomEl = document.querySelector("li[data-roomId='" + roomId + "']")
//  if (roomEl) {
//    let unread = roomEl.querySelector('.unread-count')
//    if (unread) {
//      let count = parseInt(unread.textContent)
//      count++
//      unread.textContent = count
//      roomEl.querySelector('.last-msg').innerText = message
//      roomEl.querySelector('.last-updated').innerText = window.timeago(
//        new Date() - new Date()
//      )
//    } else {
//      console.log('msg in dom')
//      roomEl.querySelector('.last-msg').innerText = message
//      roomEl.querySelector('.last-updated').innerText = window.timeago(
//        new Date() - new Date()
//      )
//      let elStr =
//        '<div class="badge badge-circle badge-primary badge-border-light badge-top-right unread-count"><span>1</span></div>'
//      let div = document.createElement('div')
//      div.innerHTML = elStr
//      roomEl.appendChild(div)
//    }
//  } else {
//    newShowNotification(roomId, message)
//  }
//}
//function newShowNotification(roomId, message) {
//  const options = {
//    method: 'GET',
//    headers: {
//      Accept: 'application/json',
//      'Content-Type': 'application/json',
//    },
//  }
//  let url = '/Chat/GetChatUser/' + roomId
//  Ajax.makeRequest(url, options).then((data) => {
//    console.log(data.response)
//    if (data.response) {
//      let { id, name, avatar } = data.response
//      let notification = `<li class="list-group-item list-group-item-action user-link text-white" data-roomid="${roomId}" data-userid="${id}">
//                               <a class="position-absolute inset-0 " href="/Chat/${id}"> </a>
//                               <div class="media">
//                                   <div class="profile-avatar mr-2">
//                                       <img class="avatar-img" src="/images/${avatar}" >
//                                   </div>
//                                   <div class="media-body overflow-hidden">
//                                       <div class="d-flex mb-1">
//                                           <h6 class="text-truncate mb-0 mr-auto username">${name}</h6>
//                                           <p class="small text-nowrap last-updated" datetime="${window.timeago(
//                                             new Date() - new Date()
//                                           )}"></p>
//                                       </div>
//                                       <div class="text-truncate last-msg p-1 message">${message}</div>
//                                   </div>
//                               </div>
//                           </li>`
//      console.log(notification)
//      document
//        .querySelector('.user-list > .list-group')
//        .insertAdjacentHTML('afterbegin', notification)
//    }
//  })
//}
//
//connection.on('Notification', function (roomId, message) {
//  showNotification(roomId, message)
//})
//connection
//  .start()
//  .then(function () {
//    const roomId = document.getElementById('conversationInput').value
//    connection.invoke('JoinRoom', roomId).catch(function (err) {
//      return console.error(err.toString())
//    })
//  })
//  .catch(function (err) {
//    return console.error(err.toString())
//  })
//
//document
//  .getElementById('sendButton')
//  .addEventListener('click', function (event) {
//    sendMessage()
//    event.preventDefault()
//  })
//document
//  .getElementById('messageInput')
//  .addEventListener('click', function (event) {
//    readMessage()
//    event.preventDefault()
//  })
//document
//    .getElementById('messageInput')
//    .addEventListener('input', function (event) {
//        readMessage()
//        event.preventDefault()
//    })
//document
//  .getElementById('messageInput')
//  .addEventListener('keydown', function (event) {
//    if (event.keyCode === 13 && event.ctrlKey) {
//      const textarea = document.querySelector('#messageInput')
//      textarea.value = textarea.value + '\r\n'
//    }
//    if (event.key === 'Enter') {
//      event.preventDefault()
//      // Do more work
//      sendMessage()
//    }
//  })
//const emojiLinks = document.getElementsByClassName('emoji-link')
//for (let item of emojiLinks) {
//  item.addEventListener('click', function (event) {
//    event.preventDefault()
//    let input = document.getElementById('messageInput')
//    if (input.selectionStart || input.selectionStart === 0) {
//      document.getElementById('messageInput').value = [
//        input.value.slice(0, input.selectionStart),
//        item.firstElementChild.value,
//        input.value.slice(input.selectionEnd),
//      ].join('')
//    }
//  })
//}
//
//function sendMessage() {
//  const userId = document.getElementById('userInput').value
//  let message = document.getElementById('messageInput').value
//  const conversationId = document.getElementById('conversationInput').value
//  message = message.trim()
//  if (message) {
//    connection
//      .invoke('SendMessage', conversationId, userId, message)
//      .then(function () {
//        document.querySelector(
//          '.user-link.active .message'
//        ).textContent = message
//      })
//      .catch(function (err) {
//        return console.error(err.toString())
//      })
//  }
//  document.getElementById('messageInput').value = ''
//}
//
//function readMessage() {
//  let unread = document
//    .querySelector('.user-link.active')
//    .querySelector('.unread-count')
//  if (unread) {
//    const conversationId = document.getElementById('conversationInput').value
//    const options = {
//      method: 'PUT',
//      body: conversationId,
//      headers: {
//        Accept: 'application/json',
//        'Content-Type': 'application/json',
//      },
//    }
//    Ajax.makeRequest('/Chat/ReadMessage', options)
//      .then((data) => {
//        if (data.response) {
//          unread.remove()
//        }
//      })
//      .catch((error) => {
//        console.log(error)
//      })
//  }
//}
//
//let timer
//document.getElementsByClassName('chat-box')[0].addEventListener(
//  'scroll',
//  function () {
//    const load = document.getElementById('load-more')
//    if (timer) {
//      clearTimeout(timer)
//    }
//    timer = setTimeout(() => {
//      if (isInViewPort(load)) {
//         // update the element display
//         console.log('in viewport')
//        const currentPage = document.getElementById(
//          'Conversation_Messages_CurrentPage'
//        ).value
//        const pageCount = document.getElementById(
//          'Conversation_Messages_PageCount'
//        ).value
//        const conversationId = document.getElementById('conversationInput')
//          .value
//        if (currentPage !== pageCount) {
//          const url = `${
//            window.location.origin
//          }/Chat/LoadHistory/${conversationId}?page=${+currentPage + 1}`
//          const options = {
//            method: 'Get',
//            headers: {
//              Accept: 'application/json',
//              'Content-Type': 'application/json',
//            },
//          }
//          Ajax.makeRequest(url, options)
//            .then((data) => {
//              if (data.response || data.response.results.length > 0) {
//                data.response.results.forEach((x) => {
//                  renderMessage(
//                    x.senderId,
//                    x.content,
//                    x.timestamp,
//                    function (li) {
//                      insertAfter(li, document.getElementById('load-more'))
//                    }
//                  )
//                })
//                document.getElementById(
//                  'Conversation_Messages_CurrentPage'
//                ).value = data.response.currentPage
//              }
//            })
//            .catch((error) => {
//              console.log(error)
//            })
//        }
//      }
//    }, 1000)
//  },
//  false
//)
//
//function renderMessage(userId, message, timestamp, callback) {
//  let time = window.timeago(new Date() - new Date(timestamp))
//  let name, avatar
//  if (userId === +document.getElementById('Conversation_Sender_Id').value) {
//    name = document.getElementById('Conversation_Sender_Name').value
//    avatar = document.getElementById('Conversation_Sender_Avatar').value
//  } else {
//    name = document.getElementById('Conversation_Recipient_Name').value
//    avatar = document.getElementById('Conversation_Recipient_Avatar').value
//  }
//  let parsedMessage = BasicEmojis.parseEmojis(message)
//  let encodedMsg = `<li>
//                        <div class="media p-2">
//                            <div class="profile-avatar mr-2">
//                                <img class="avatar-img" src="/images/${avatar}" >
//                            </div>
//
//                            <div class="media-body overflow-hidden">
//                                <div class="d-flex mb-1">
//                                    <h6 class="text-truncate mb-0 mr-auto">${name}</h6>
//                                    <p class="small text-muted text-nowrap ml-4">${time}</p>
//                                </div>
//                                <div class="text-wrap text-break p-1" >${parsedMessage}</div>
//                            </div>
//                        </div>
//                    </li>`
//  let li = document.createElement('li')
//  li.innerHTML = encodedMsg
//  callback(li)
//}

//function isInViewPort(element) {
//  // Get the bounding client rectangle position in the viewport
//  const bounding = element.getBoundingClientRect()
//
//  // Checking part. Here the code checks if it's *fully* visible
//  // Edit this part if you just want a partial visibility
//  return (
//    bounding.top >= 0 &&
//    bounding.left >= 0 &&
//    bounding.right <=
//      (window.innerWidth || document.documentElement.clientWidth) &&
//    bounding.bottom <=
//      (window.innerHeight || document.documentElement.clientHeight)
//  )
//}
//
//function insertAfter(newNode, referenceNode) {
//  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
//}
//
//const BasicEmojis = {
//  parseEmojis: function (content) {
//    // content = `<span>${content}</span>`;
//    content = content.replace(/(:\))/g, this.addImage('emoji1.png'))
//    // content = content.replace(":)", this.addImage("emoji1.png"));
//    content = content.replace(/(:[P])/g, this.addImage('emoji2.png'))
//    // content = content.replace(":P", this.addImage("emoji2.png"));
//    content = content.replace(/(:[O])/g, this.addImage('emoji3.png'))
//    // content = content.replace(":O", this.addImage("emoji3.png"));
//    content = content.replace(/(:[\-]+\))/g, this.addImage('emoji4.png'))
//    // content = content.replace(":-)", this.addImage("emoji4.png"));
//    content = content.replace(/(B\|)/g, this.addImage('emoji5.png'))
//    // content = content.replace("B|", this.addImage("emoji5.png"));
//    content = content.replace(/(:[D])/g, this.addImage('emoji6.png'))
//    // content = content.replace(":D", this.addImage("emoji6.png"));
//    content = content.replace(/(<3)/g, this.addImage('emoji7.png'))
//    // content = content.replace("<3", this.addImage("emoji7.png"));
//    return content
//  },
//  addImage: function (imageName) {
//    return `<img class="emoji" alt="emoji" src="/images/emojis/${imageName}">`
//  },
//}
//
//window.onload = function () {
//  let messages = document.getElementsByClassName('message')
//  for (let message of messages) {
//    message.innerHTML = BasicEmojis.parseEmojis(message.innerText)
//  }
//}
//
//const chatDropLinks = document.querySelectorAll('#chat-dropdown a')
//for (let link of chatDropLinks) {
//  link.addEventListener('click', function (e) {
//    e.preventDefault() // cancel the link behaviour
//    const el = e.target
//    el.textContent === '🚫 Block User'
//      ? blockUser(el, 'block')
//      : blockUser(el, 'report')
//  })
//}
//
//function blockUser(el, status) {
//  const roomId = document.getElementById('conversationInput').value
//  let url =
//    status === 'block'
//      ? '/Chat/BlockUser/' + roomId
//      : '/Chat/BlockUser/' + roomId + '?isReported=true'
//  const options = {
//    method: 'POST',
//    headers: {
//      Accept: 'application/json',
//      'Content-Type': 'application/json',
//    },
//  }
//  Ajax.makeRequest(url, options)
//    .then((data) => {
//      if (data.response) {
//        if (data.response.success) {
//          document.getElementById('sendButton').disabled = false
//          document.getElementById('messageInput').disabled = false
//          document.getElementById('chatIcon').disabled = false
//          document.getElementById('chat-blocker').classList.toggle('d-none')
//          document
//            .getElementById('chat-box')
//            .classList.replace('overflow-hidden', 'overflow-auto')
//          if (status === 'block') {
//            el.textContent = '🚫 Unblock User'
//          } else {
//            el.textContent = '☣️ Remove Report'
//          }
//        }
//      }
//    })
//    .catch((error) => {
//      console.log(error)
//    })
//}
