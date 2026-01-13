using Microsoft.AspNetCore.Mvc;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Services.AD;

namespace Project.Api.Controllers.AD
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController(IAccountService service) : ControllerBase
    {
        public readonly IAccountService _service = service;

        [HttpGet("Search")]
        public async Task<IActionResult> Search([FromQuery] AccountDto filter)
        {
            var res = new TransferObject();
            var data = await _service.Search(filter);
            if (_service.Status)
            {
                res.Data = data;
            }
            else
            {
                await res.GetMessage("0001", _service);
            }
            return Ok(res);
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var res = new TransferObject();
            var data = await _service.GetAll();
            if (_service.Status)
            {
                res.Data = data;
            }
            else
            {
                await res.GetMessage("0001", _service);
            }
            return Ok(res);
        }

        [HttpPost("Insert")]
        public async Task<IActionResult> Insert([FromBody] AccountDto request)
        {
            var res = new TransferObject();
            await _service.InsertAccount(request);
            if (_service.Status)
            {
                await res.GetMessage("0100", _service);
            }
            else
            {
                await res.GetMessage("0101", _service);
            }
            return Ok(res);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] AccountDto request)
        {
            var res = new TransferObject();
            await _service.UpdateAccount(request);
            if (_service.Status)
            {
                await res.GetMessage("0103", _service);
            }
            else
            {
                await res.GetMessage("0104", _service);
            }
            return Ok(res);
        }

        [HttpGet("Detail/{userName}")]
        public async Task<IActionResult> Detail([FromRoute] string userName)
        {
            var res = new TransferObject();
            var data = await _service.GetDetail(userName);
            if (_service.Status)
            {
                res.Data = data;
            }
            else
            {
                await res.GetMessage("0001", _service);
            }
            return Ok(res);
        }

        [HttpPut("UpdateAccountRight")]
        public async Task<IActionResult> UpdateAccountRight([FromBody] AccountRightDto request)
        {
            var res = new TransferObject();
            await _service.UpdateAccountRight(request);
            if (_service.Status)
            {
                await res.GetMessage("0103", _service);
            }
            else
            {
                await res.GetMessage("0104", _service);
            }
            return Ok(res);
        }

        [HttpPost("ChangePassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            var res = new TransferObject();
            await _service.ChangePassword(request);

            if (!_service.Status)
            {
                res.Status = false;
                res.MessageObject = _service.MessageObject; // Trả về message cụ thể từ service
            }
            return Ok(res);
        }
    }
}
