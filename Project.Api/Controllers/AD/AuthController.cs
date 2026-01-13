using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project.Service.Common;
using Project.Service.Dtos.AD;
using Project.Service.Services.AD;

namespace Project.Api.Controllers.AD
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(IAuthService service) : ControllerBase
    {
        public readonly IAuthService _service = service;

        [HttpPost("Login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto loginInfo)
        {
            var res = new TransferObject();
            var loginResult = await _service.Login(loginInfo, Request);
            if (_service.Status)
            {
                res.Status = true;
                res.Data = loginResult;
            }
            else
            {
                res.Status = false;
                res.MessageObject.Code = _service.MessageObject.Code;
                res.MessageObject.Message = _service.MessageObject.Message;
                res.MessageObject.MessageDetail = _service.MessageObject.MessageDetail;
            }
            return Ok(res);
        }

        [HttpPost("JoinAsGuest")]
        [AllowAnonymous]
        public async Task<IActionResult> JoinAsGuest([FromBody] JoinAsGuestDto request)
        {
            var res = new TransferObject();
            var loginResult = await _service.JoinAsGuest(request);
            if (_service.Status)
            {
                res.Status = true;
                res.Data = loginResult;
            }
            else
            {
                res.Status = false;
                res.MessageObject.Code = _service.MessageObject.Code;
                res.MessageObject.Message = _service.MessageObject.Message;
                res.MessageObject.MessageDetail = _service.MessageObject.MessageDetail;
            }
            return Ok(res);
        }

        [HttpPost("LoginFace/{faceId}")]
        [AllowAnonymous]
        public async Task<IActionResult> LoginFace([FromRoute] string faceId)
        {
            var res = new TransferObject();
            var loginResult = await _service.LoginFace(faceId, Request);
            if (_service.Status)
            {
                res.Status = true;
                res.Data = loginResult;
            }
            else
            {
                res.Status = false;
                res.MessageObject.Code = _service.MessageObject.Code;
                res.MessageObject.Message = _service.MessageObject.Message;
                res.MessageObject.MessageDetail = _service.MessageObject.MessageDetail;
            }
            return Ok(res);
        }
    }
}
