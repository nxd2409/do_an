using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Project.Api.Hubs;
using Project.Service.Dtos.CM;

namespace Project.Api.Controllers.HUB
{

    [ApiController]
    [Route("api/[controller]")]
    public class NotifyController : ControllerBase
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotifyController(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        // Gửi đến 1 user cụ thể
        [HttpPost("single")]
        public async Task<IActionResult> SendToUser([FromBody] NotifyRequest request)
        {
            var connectionId = NotificationHub.GetConnectionId(request.Username);
            if (connectionId == null)
                return NotFound($"User {request.Username} chưa kết nối");

            await _hubContext.Clients.Client(connectionId)
                .SendAsync("ReceiveNotification", new
                {
                    username = request.Username,
                    action = request.Action,
                    message = request.Message
                });

            return Ok($"Đã gửi tới {request.Username}");
        }

        // Gửi đến danh sách user
        [HttpPost("multi")]
        public async Task<IActionResult> SendToUsers([FromBody] MultiNotifyRequest request)
        {
            var connectionIds = NotificationHub.GetConnectionIds(request.Usernames);
            if (!connectionIds.Any())
                return NotFound("Không có user nào online");

            await _hubContext.Clients.Clients(connectionIds)
                .SendAsync("ReceiveNotification", new
                {
                    usernames = request.Usernames,
                    action = request.Action,
                    message = request.Message
                });

            return Ok($"Đã gửi tới {connectionIds.Count} user");
        }

        // Gửi đến toàn bộ user đang kết nối
        //[HttpPost("all")]
        //public async Task<IActionResult> SendToAll([FromBody] GlobalNotifyRequest request)
        //{
        //    await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
        //    {
        //        username = "system",
        //        action = request.Action,
        //        message = request.Message
        //    });

        //    return Ok("Đã gửi đến toàn bộ user online");
        //}
    }

}
