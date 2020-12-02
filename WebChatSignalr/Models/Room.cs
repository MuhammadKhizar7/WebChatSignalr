using System;
using System.Collections.Generic;

namespace WebChatSignalr.Models
{
    public class Room
    {
        public Room()
        {
            Messages=new List<Message>();
        }
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsBlocked { get; set; }
        public bool IsReported { get; set; }
        public int? BlockedBy { get; set; }
        public int UnreadCount { get; set; }
        public DateTime UpdatedDate { get; set; }
        public int UpdatedBy { get; set; }
        public int? CreatorId { get; set; }
        public AppUser Creator { get; set; }
        public int? UserId { get; set; }
        public AppUser User { get; set; }
        public ICollection<Message> Messages { get; set; }
    }   
}   