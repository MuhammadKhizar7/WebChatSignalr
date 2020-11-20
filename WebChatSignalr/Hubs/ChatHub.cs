using System;
using System.Globalization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace WebChatSignalr.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(string conversationId,string userId, string message)
        {
            var timestamp = DateTime.Now;
            await Clients.Group(conversationId).SendAsync("ReceiveMessage", userId, message, timestamp.ToString(CultureInfo.InvariantCulture));
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
    }
}