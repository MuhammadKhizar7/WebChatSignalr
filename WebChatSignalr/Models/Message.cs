using System;
using System.Linq;
using System.Threading.Tasks;

namespace WebChatSignalr.Models
{
    public class Message
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public DateTime Timestamp { get; set; }
        public int UserId { get; set; } 
        public AppUser User { get; set; }
        public int RoomId { get; set; }
        public Room Room { get; set; }
    }
}
