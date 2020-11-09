using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebChatSignalr.Data;
using WebChatSignalr.Models;
using WebChatSignalr.ViewModels;

namespace WebChatSignalr.Controllers
{
    [Authorize]
    public class ChatController : Controller
    {
        private readonly ApplicationDbContext _dbContext;

        public ChatController(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        // GET
        public async Task<IActionResult> Index(int? id)
        {
            var  loginUserId = Convert.ToInt32(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var connectedRooms = await _dbContext.Rooms
                .Include(x=>x.User)
                .Include(x=>x.Creator)
                .Where(x => x.CreatorId == loginUserId || x.UserId == loginUserId && x.IsBlocked==false)
                .Select(x=> new RoomViewModel
                {
                    Id = x.Id,
                    Sender = new PersonViewModel
                    {
                        Id = (x.UserId != null && (x.UserId != loginUserId)) ? x.UserId : x.CreatorId,
                        Name = (x.UserId != null && (x.UserId != loginUserId)) ? x.User.Name : x.Creator.Name,
                        Avatar = (x.UserId != null && (x.UserId != loginUserId)) ? x.User.Avatar : x.Creator.Avatar
                    },
                    Recipient = new PersonViewModel
                    {
                        Id = (x.UserId != null && (x.UserId == loginUserId)) ? x.UserId : x.CreatorId,
                        Name = (x.UserId != null && (x.UserId == loginUserId)) ? x.User.Name : x.Creator.Name,
                        Avatar = (x.UserId != null && (x.UserId == loginUserId)) ? x.User.Avatar : x.Creator.Avatar
                    },
                    UpdatedDate = x.UpdatedDate,
                    UnreadCount = x.UnreadCount,
                    Excerpt = x.Messages.OrderByDescending(x=>x.Timestamp).FirstOrDefault().Content
                })
                .OrderBy(x=>x.UpdatedDate)
                .ToListAsync();
            if (id != null && await _dbContext.Rooms.AnyAsync(x=>x.CreatorId==id || x.UserId==id))
            {
                // var currentRoom = connectedRooms.First(x => x.CreatorId == id || x.UserId == id);
                // var messages =await _dbContext.Messages.Where(x => x.RoomId == currentRoom.Id).ToListAsync();
                // currentRoom.Messages = messages;
            }
            else if (id != null && await _dbContext.Users.AnyAsync(x=>x.Id == id))
            {
                var newRoom = new Room
                {
                    CreatorId = loginUserId,
                    UserId = id,
                    UpdatedDate = DateTime.Now
                };

               await _dbContext.Rooms.AddAsync(newRoom);
               await _dbContext.SaveChangesAsync();
            }

            var chat = new ChatViewModel
            {
                Rooms = connectedRooms,
                Messages = new List<MessageViewModel>()
            };
      
            return View(chat);
        }
        [HttpPost]
        public async Task<Room> CreateRoom(Room room)
        {
            var roomx = new Room 
            {
                Name = "NewRoom",
                CreatorId = 1,
                UserId = 2
            };
            await _dbContext.Rooms.AddAsync(roomx);
            await _dbContext.SaveChangesAsync();
            return roomx;
        }
        [HttpPost]
        public async Task<IActionResult> LeaveRoom(int roomId)
        {
            var room = new Room 
            {
                Name = "NewRoom",
                CreatorId = 1,
            };
             _dbContext.Rooms.Remove(room);
             await _dbContext.SaveChangesAsync();
            return Json(room.Id);
        }
        [HttpGet]
        public async Task<IActionResult> LoadHistory(int roomId)
        {
          // var messages = await _dbContext.Messages.Where(x => x.RoomId == roomId).ToListAsync();
          var messages = new List<Message>
          {
              new Message
              {
                  Id = 1,
                  Content = "Hello world",
                  Timestamp = DateTime.Now,
                  RoomId = 1,
                  UserId = 1,

              }
          };
            return Json(messages);
        }
        
    }
}