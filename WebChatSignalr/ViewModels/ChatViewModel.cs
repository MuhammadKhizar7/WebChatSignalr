﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebChatSignalr.Models;
using WebChatSignalr.Utils.Pagination;

namespace WebChatSignalr.ViewModels
{
    public class ChatViewModel
    {
        public ChatViewModel()
        {
            Rooms = new  PagedResult<RoomViewModel>();
            Conversation = new ConversationViewModel();
        }
        public PagedResult<RoomViewModel> Rooms { get; set; }
        public ConversationViewModel Conversation { get; set; }
    }
    public class RoomViewModel{
        public int Id { get; set; }
        public bool IsBlocked { get; set; }
        public bool IsReported { get; set; }
        public int? BlockedBy { get; set; }
        public int UpdateBy { get; set; }
        public string Excerpt { get; set; }
        public PersonViewModel Sender { get; set; }
        public PersonViewModel Recipient { get; set; }
        public int UnreadCount { get; set; }
        public DateTime UpdatedDate { get; set; }
    }

   public class ConversationViewModel
    {
        public ConversationViewModel()
        {
            Messages = new PagedResult<MessageViewModel>();
        }

        public string Id { get; set; }
        public bool IsBlocked { get; set; }
        public bool IsReported { get; set; }
        public int? BlockedBy { get; set; }
        public PersonViewModel Sender { get; set; }
        public PersonViewModel Recipient { get; set; }
        public PagedResult<MessageViewModel> Messages { get; set; }
    }
    public class MessageViewModel
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public DateTime Timestamp { get; set; }
        public int SenderId { get; set; }
       
    }

    public class PersonViewModel
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        public string Avatar { get; set; }
    }
}
