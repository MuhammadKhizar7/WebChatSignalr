using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace WebChatSignalr.Models
{
    public class AppUser:IdentityUser<int>
    {
        public string Name { get; set; }
        public string Avatar { get; set; }
        public ICollection<Room> Rooms { get; set; }
        public ICollection<Message> Messages { get; set; }
    }
}
