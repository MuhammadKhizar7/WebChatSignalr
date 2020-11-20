using System;
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
            var loginUserId = Convert.ToInt32(User.FindFirstValue(ClaimTypes.NameIdentifier));
            if (id !=null && id==loginUserId)
            {
                id = null;
                return RedirectToActionPermanent(nameof(Index), new { id = id });
            }
            var connectedRooms = await _dbContext.Rooms
                .Include(x => x.User)
                .Include(x => x.Creator)
                .Where(x => (x.CreatorId == loginUserId || x.UserId == loginUserId) && !x.IsBlocked)
                .Select(x => new RoomViewModel
                {
                    Id = x.Id,
                    Sender = new PersonViewModel
                    {
                        Id = x.UserId != null && x.UserId != loginUserId ? x.UserId : x.CreatorId,
                        Name = x.UserId != null && x.UserId != loginUserId ? x.User.Name : x.Creator.Name,
                        Avatar = x.UserId != null && x.UserId != loginUserId ? x.User.Avatar : x.Creator.Avatar
                    },
                    Recipient = new PersonViewModel
                    {
                        Id = x.UserId != null && x.UserId == loginUserId ? x.UserId : x.CreatorId,
                        Name = x.UserId != null && x.UserId == loginUserId ? x.User.Name : x.Creator.Name,
                        Avatar = x.UserId != null && x.UserId == loginUserId ? x.User.Avatar : x.Creator.Avatar
                    },
                    UpdatedDate = x.UpdatedDate,
                    UnreadCount = x.UnreadCount,
                    Excerpt = x.Messages.OrderByDescending(message => message.Timestamp).FirstOrDefault().Content
                })
                .OrderBy(x => x.UpdatedDate)
                .ToListAsync();
            var conversation = new ConversationViewModel();
            if (id != null && await _dbContext.Users.AnyAsync(x => x.Id == id))
            {
                var currentRoom = await _dbContext.Rooms
                    .Include(x => x.User)
                    .Include(x => x.Creator)
                    .Where(x => (x.CreatorId == loginUserId || x.UserId == loginUserId) && !x.IsBlocked)
                    .Select(x => new RoomViewModel
                    {
                        Id = x.Id,
                        Sender = new PersonViewModel
                        {
                            Id = x.UserId != null && x.UserId != loginUserId ? x.UserId : x.CreatorId,
                            Name = x.UserId != null && x.UserId != loginUserId ? x.User.Name : x.Creator.Name,
                            Avatar = x.UserId != null && x.UserId != loginUserId ? x.User.Avatar : x.Creator.Avatar
                        },
                        Recipient = new PersonViewModel
                        {
                            Id = x.UserId != null && x.UserId == loginUserId ? x.UserId : x.CreatorId,
                            Name = x.UserId != null && x.UserId == loginUserId ? x.User.Name : x.Creator.Name,
                            Avatar = x.UserId != null && x.UserId == loginUserId ? x.User.Avatar : x.Creator.Avatar
                        },
                        UpdatedDate = x.UpdatedDate,
                        UnreadCount = x.UnreadCount,
                        Excerpt = x.Messages.OrderByDescending(message => message.Timestamp).FirstOrDefault().Content
                    })
                    .FirstOrDefaultAsync(x => x.Sender.Id == id);
                if (currentRoom == null)
                {
                    var newRoom = new Room
                    {
                        CreatorId = loginUserId,
                        UserId = id,
                        UpdatedDate = DateTime.Now
                    };
                    await _dbContext.Rooms.AddAsync(newRoom);
                    await _dbContext.SaveChangesAsync();

                    currentRoom = await _dbContext.Rooms
                        .Include(x => x.User)
                        .Include(x => x.Creator)
                        .Select(x => new RoomViewModel
                        {
                            Id = x.Id,
                            Sender = new PersonViewModel
                            {
                                Id = x.UserId != null && x.UserId != loginUserId ? x.UserId : x.CreatorId,
                                Name = x.UserId != null && x.UserId != loginUserId ? x.User.Name : x.Creator.Name,
                                Avatar = x.UserId != null && x.UserId != loginUserId ? x.User.Avatar : x.Creator.Avatar
                            },
                            Recipient = new PersonViewModel
                            {
                                Id = x.UserId != null && x.UserId == loginUserId ? x.UserId : x.CreatorId,
                                Name = x.UserId != null && x.UserId == loginUserId ? x.User.Name : x.Creator.Name,
                                Avatar = x.UserId != null && x.UserId == loginUserId ? x.User.Avatar : x.Creator.Avatar
                            },
                            UpdatedDate = x.UpdatedDate
                        })
                        .FirstOrDefaultAsync(x => x.Id == newRoom.Id);
                    conversation.Id = currentRoom.Id.ToString();
                    conversation.Sender = currentRoom.Sender;
                    conversation.Recipient = currentRoom.Recipient;
                    connectedRooms.Insert(0, currentRoom);
                }
                else
                {
                    conversation.Id = currentRoom.Id.ToString();
                    conversation.Recipient = currentRoom.Recipient;
                    conversation.Sender = currentRoom.Sender;
                    conversation.Messages = await _dbContext.Messages
                        .Where(x => x.RoomId == currentRoom.Id)
                        .Select(x => new MessageViewModel
                        {
                            Id = x.RoomId,
                            Content = x.Content,
                            SenderId = x.UserId,
                            Timestamp = x.Timestamp
                        }).ToListAsync();
                }
            }

            var chat = new ChatViewModel
            {
                Rooms = connectedRooms,
                Conversation = conversation
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
                CreatorId = 1
            };
            _dbContext.Rooms.Remove(room);
            await _dbContext.SaveChangesAsync();
            return Json(room.Id);
        }

        [HttpGet]
        public async Task<IActionResult> LoadHistory(int roomId)
        {
            var messages = await _dbContext.Messages.Where(x => x.RoomId == roomId).ToListAsync();
            return Json(messages);
        }
    }
}