using Microsoft.AspNetCore.Mvc;
using Project.Api.Hubs;
using Project.Service.Common;

namespace Project.Api.Controllers.HUB
{
    [ApiController]
    [Route("api/[controller]")]
    public class SignalRController : ControllerBase
    {
        [HttpGet("IsConnected/{username}")]
        public IActionResult IsConnected(string username)
        {
            bool connected = NotificationHub.IsConnected(username);
            return Ok(new { username, connected });
        }

        [HttpGet("GetOnlineUsers")]
        public IActionResult GetOnlineUsers()
        {
            var res = new TransferObject();
            res.Data = NotificationHub.GetOnlineUsernames();
            return Ok(res);
        }
    }
}
