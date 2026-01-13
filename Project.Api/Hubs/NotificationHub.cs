using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace Project.Api.Hubs
{
    public class NotificationHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> _connections = new();

        public override async Task OnConnectedAsync()
        {
            var username = Context.User?.Identity?.Name ?? Context.GetHttpContext()?.Request.Query["username"];
            if (!string.IsNullOrEmpty(username))
            {
                _connections[username] = Context.ConnectionId;
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var username = _connections.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
            if (!string.IsNullOrEmpty(username))
            {
                _connections.TryRemove(username, out _);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public static string? GetConnectionId(string username)
        {
            _connections.TryGetValue(username, out var connectionId);
            return connectionId;
        }

        public static List<string> GetConnectionIds(IEnumerable<string> usernames)
        {
            return usernames
                .Select(u => _connections.TryGetValue(u, out var id) ? id : null)
                .Where(id => id != null)
                .ToList()!;
        }

        public static IEnumerable<string> GetAllConnectionIds()
        {
            return _connections.Values;
        }
        public static IEnumerable<string> GetOnlineUsernames()
        {
            return _connections.Keys;
        }
        public static bool IsConnected(string username)
        {
            return !string.IsNullOrEmpty(username) && _connections.ContainsKey(username);
        }
    }
}
