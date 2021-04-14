using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WebChatSignalr.Data;
using WebChatSignalr.Hubs;
using WebChatSignalr.Models;
using WebChatSignalr.Utils.Pagination;
using WebChatSignalr.ViewModels;

namespace WebChatSignalr.Controllers
{
    [Authorize]
    public class ChatController : Controller
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(ApplicationDbContext dbContext, IHubContext<ChatHub> hubContext)
        {
            _dbContext = dbContext;
            _hubContext = hubContext;
        }

        // GET
        [Route("[Controller]/{id?}")]
        public async Task<IActionResult> Index(int? id)
        {
            const int page = 1;
            const int pageSize = 20;
            var loginUserId = CurrentLoginUser();
            if (id != null && id == loginUserId)
            {
                id = null;
                return RedirectToActionPermanent(nameof(Index), new { id });
            }

            var connectedRooms = await _dbContext.Rooms.Include(x => x.User)
                .Include(x => x.Creator)
                .Where(x => (x.CreatorId == loginUserId || x.UserId == loginUserId))
                .OrderByDescending(x => x.UpdatedDate)
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
                    UpdateBy = x.UpdatedBy,
                    UnreadCount = x.UnreadCount,
                    Excerpt = x.Messages.OrderByDescending(message => message.Timestamp).FirstOrDefault().Content
                })
                .OrderByDescending(x => x.UpdatedDate)
                .GetPagedAsync(page, pageSize);
            var conversation = new ConversationViewModel();
            if (id != null && await _dbContext.Users.AnyAsync(x => x.Id == id))
            {
                var currentRoom = await _dbContext.Rooms.Include(x => x.User)
                    .Include(x => x.Creator)
                    .Where(x => (x.CreatorId == loginUserId || x.UserId == loginUserId))
                    .Select(x => new RoomViewModel
                    {
                        Id = x.Id,
                        Sender = new PersonViewModel
                        {
                            Id = x.UserId != null && x.UserId != loginUserId ? x.UserId : x.CreatorId,
                            Name = x.UserId != null && x.UserId != loginUserId ? x.User.Name : x.Creator.Name,
                            Avatar = x.UserId != null && x.UserId != loginUserId
                                ? x.User.Avatar
                                : x.Creator.Avatar
                        },
                        Recipient = new PersonViewModel
                        {
                            Id = x.UserId != null && x.UserId == loginUserId ? x.UserId : x.CreatorId,
                            Name = x.UserId != null && x.UserId == loginUserId ? x.User.Name : x.Creator.Name,
                            Avatar = x.UserId != null && x.UserId == loginUserId
                                ? x.User.Avatar
                                : x.Creator.Avatar
                        },
                        UpdatedDate = x.UpdatedDate,
                        UpdateBy = x.UpdatedBy,
                        UnreadCount = x.UnreadCount,
                        BlockedBy = x.BlockedBy,
                        IsBlocked = x.IsBlocked,
                        IsReported = x.IsReported,
                        Excerpt = x.Messages.OrderByDescending(message => message.Timestamp)
                            .FirstOrDefault()
                            .Content
                    })
                    .FirstOrDefaultAsync(x => x.Sender.Id == id);
                if (currentRoom == null)
                {
                    var newRoom = new Room { CreatorId = loginUserId, UserId = id, UpdatedDate = DateTime.Now };
                    await _dbContext.Rooms.AddAsync(newRoom);
                    await _dbContext.SaveChangesAsync();

                    currentRoom = await _dbContext.Rooms.Include(x => x.User)
                        .Include(x => x.Creator)
                        .Select(x => new RoomViewModel
                        {
                            Id = x.Id,
                            Sender = new PersonViewModel
                            {
                                Id = x.UserId != null && x.UserId != loginUserId ? x.UserId : x.CreatorId,
                                Name = x.UserId != null && x.UserId != loginUserId
                                    ? x.User.Name
                                    : x.Creator.Name,
                                Avatar = x.UserId != null && x.UserId != loginUserId
                                    ? x.User.Avatar
                                    : x.Creator.Avatar
                            },
                            Recipient = new PersonViewModel
                            {
                                Id = x.UserId != null && x.UserId == loginUserId ? x.UserId : x.CreatorId,
                                Name = x.UserId != null && x.UserId == loginUserId
                                    ? x.User.Name
                                    : x.Creator.Name,
                                Avatar = x.UserId != null && x.UserId == loginUserId
                                    ? x.User.Avatar
                                    : x.Creator.Avatar
                            },
                            UpdatedDate = x.UpdatedDate,
                            UpdateBy = x.UpdatedBy,
                        })
                        .FirstOrDefaultAsync(x => x.Id == newRoom.Id);
                    conversation.Id = currentRoom.Id.ToString();
                    conversation.Sender = currentRoom.Sender;
                    conversation.Recipient = currentRoom.Recipient;
                    connectedRooms.Results.Insert(0, currentRoom);
                }
                else
                {
                    conversation.Id = currentRoom.Id.ToString();
                    conversation.IsBlocked = currentRoom.IsBlocked;
                    conversation.IsReported = currentRoom.IsReported;
                    conversation.BlockedBy = currentRoom.BlockedBy;
                    conversation.Recipient = currentRoom.Recipient;
                    conversation.Sender = currentRoom.Sender;
                    conversation.Messages = await _dbContext.Messages.Where(x => x.RoomId == currentRoom.Id)
                        .OrderByDescending(x => x.Timestamp)
                        .Select(x => new MessageViewModel
                        {
                            Id = x.Id,
                            Content = x.Content,
                            SenderId = x.UserId,
                            Timestamp = x.Timestamp
                        })
                        .GetPagedAsync(page, pageSize);
                }
            }

            conversation.Messages.Results.Reverse();
            var chat = new ChatViewModel { Rooms = connectedRooms, Conversation = conversation };

            return View(chat);
        }

        [HttpPut]
        public async Task<bool> ReadMessage([FromBody] int conversationId)
        {
            var loginUserId = CurrentLoginUser();
            var room = await _dbContext.Rooms.FirstOrDefaultAsync(x => x.Id == conversationId &&
                                                                       (x.UserId == loginUserId ||
                                                                        x.CreatorId == loginUserId));
            if (room == null) return false;
            room.UnreadCount = 0;
            _dbContext.Rooms.Update(room);
            await _dbContext.SaveChangesAsync();
            return true;

        }

        [HttpPost]
        public async Task<Message> SendMessage(Message message)
        {
            var sendMessage = new Message
            {
                Content = message.Content,
                RoomId = message.RoomId,
                Timestamp = DateTime.Now,
                UserId = message.UserId
            };
            await _dbContext.Messages.AddAsync(sendMessage);
            await _dbContext.SaveChangesAsync();
            await _hubContext.Clients.Groups(sendMessage.RoomId.ToString()).SendAsync("ReceiveMessage", sendMessage);
            return sendMessage;
        }

        // [HttpPost]
        // public async Task<Room> CreateRoom(Room room)
        // {
        //     var roomx = new Room {Name = "NewRoom", CreatorId = 1, UserId = 2};
        //     await _dbContext.Rooms.AddAsync(roomx);
        //     await _dbContext.SaveChangesAsync();
        //     return roomx;
        // }

        [HttpPost("[Controller]/[Action]/{roomId}")]
        public async Task<ActionResult> BlockUser(int roomId, bool isReported = false)
        {
            var room = await _dbContext.Rooms.FirstOrDefaultAsync(x => x.Id == roomId);
            if (room == null)
                return BadRequest(new { Success = false, Message = "You are not able to use this operation" });
            room.IsBlocked = !room.IsBlocked;
            room.IsReported = isReported && room.IsBlocked;
            room.BlockedBy = room.IsBlocked ? CurrentLoginUser() : 0;
            room.UpdatedBy = CurrentLoginUser();
            _dbContext.Rooms.Update(room);
            await _dbContext.SaveChangesAsync();
            return Ok(new
            {
                Success = true,
                Message = "You block this conversation now this user cannot message you anymore"
            });
        }

        [HttpPost]
        public async Task<IActionResult> DeleteChat(int roomId)
        {
            var room = await _dbContext.Rooms.Where(x => x.Id == roomId).FirstOrDefaultAsync();
            _dbContext.Rooms.Remove(room);
            await _dbContext.SaveChangesAsync();
            return Ok(room.Id);
        }

        [HttpGet("[Controller]/[Action]/{id}")]
        public async Task<IActionResult> LoadHistory(int id, int page = 1)
        {
            var pageSize = 20;
            var messages = await _dbContext.Messages.Where(x => x.RoomId == id)
                .Select(x => new MessageViewModel
                {
                    Id = x.Id,
                    Content = x.Content,
                    Timestamp = x.Timestamp,
                    SenderId = x.UserId
                })
                .OrderByDescending(x => x.Timestamp)
                .GetPagedAsync(page, pageSize);
            return Ok(messages);
        }
        [HttpGet("[Controller]/[Action]/{id}")]
        public async Task<IActionResult> GetChatUser(int id)
        {
            var room =await _dbContext.Rooms.Include(x=>x.User).Include(x=>x.Creator).Select(x=> new RoomViewModel
            {
                Id = x.Id,
                Sender = new PersonViewModel
                {
                    Id = x.User.Id!=CurrentLoginUser()? x.User.Id : x.Creator.Id,
                    Name = x.User.Id!=CurrentLoginUser()? x.User.Name : x.Creator.Name,
                    Avatar = x.User.Id!=CurrentLoginUser()? x.User.Avatar : x.Creator.Avatar,
                }
    
            }).FirstOrDefaultAsync(r => r.Id == id);
            return Ok(room.Sender);
        }

        private int CurrentLoginUser()
        {
            return Convert.ToInt32(User.FindFirstValue(ClaimTypes.NameIdentifier));
        }
    }
}