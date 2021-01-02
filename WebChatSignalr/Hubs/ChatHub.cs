using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WebChatSignalr.Data;
using WebChatSignalr.Models;
using WebChatSignalr.Utils.Helpers;

namespace WebChatSignalr.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _db;
        private static readonly Dictionary<string, string> OnlineUser = new Dictionary<string, string>();
        public ChatHub(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task SendMessage(string conversationId,string userId, string message)
        {
            var roomId = Convert.ToInt32(conversationId);
            var loginUserId = Convert.ToInt32(GetLoginUser());
            var room =await _db.Rooms.FirstOrDefaultAsync(x => x.Id == roomId);
            if (room==null)
            {
                return; 
            }

            try
            {
                room.UnreadCount += 1;
                room.UpdatedDate= DateTime.Now;
                room.UpdatedBy = loginUserId;
                if (room.UserId != null)
                {
                    var newMessage = new Message
                    {
                        Content = Regex.Replace(message.Trim(), @"(?i)<(?!img|a|/a|/img).*?>", string.Empty),
                        RoomId = roomId,
                        UserId = loginUserId,
                        Timestamp = DateTime.Now
                    };
                    room.Messages.Add(newMessage);
                    await _db.SaveChangesAsync();
                    await Clients.Group(conversationId).SendAsync("ReceiveMessage", newMessage.UserId, newMessage.Content, newMessage.Timestamp);
                    var otherUser = loginUserId == room.UserId ? room.CreatorId : room.UserId;
                    if (OnlineUser.TryGetValue(otherUser.ToString(), out string connectionId))
                    {
                        await SendNotification(connectionId, newMessage.RoomId.ToString(),
                            newMessage.Content);
                    }
                }
            }
            catch (Exception e)
            {
                await Clients.Caller.SendAsync("onError", "Message not send! Message should be 1-500 characters.", e);
            }
        }

        public override Task OnConnectedAsync()
        {
            var loginUserId = GetLoginUser();
            if (!OnlineUser.ContainsKey(loginUserId))
            {
                OnlineUser.Add(loginUserId,Context.ConnectionId);
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            OnlineUser.Remove(GetLoginUser());
            return base.OnDisconnectedAsync(exception);
        }

        public async Task JoinRoom(string roomId)
        {
            if (string.IsNullOrEmpty(roomId))
                throw new ArgumentException("Invalid room ID");

            await Groups.AddToGroupAsync(
                Context.ConnectionId, roomId);
        }

        public async Task LeaveRoom(string roomId)
        {
            if (string.IsNullOrEmpty(roomId))
                throw new ArgumentException("Invalid room ID");

            await Groups.RemoveFromGroupAsync(
                Context.ConnectionId, roomId);
        }

        private async Task SendNotification(string userId, string roomId, string message)
        {
            await Clients.Client(userId).SendAsync("Notification",roomId, message);
        }

        private string GetLoginUser()
        {
            return  Context.GetHttpContext().User.FindFirstValue(ClaimTypes.NameIdentifier).ToString();
        }
       
    }
   
}