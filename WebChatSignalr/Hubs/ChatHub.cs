using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace WebChatSignalr.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }

        public async Task JoinRoom(string roomId)
        {
            if (string.IsNullOrEmpty(roomId))
                throw new ArgumentException("Invalid room ID");

            await Groups.AddToGroupAsync(
                Context.ConnectionId, roomId.ToString());
        }

        public async Task LeaveRoom(string roomId)
        {
            if (string.IsNullOrEmpty(roomId))
                throw new ArgumentException("Invalid room ID");

            await Groups.RemoveFromGroupAsync(
                Context.ConnectionId, roomId.ToString());
        }
    }
}