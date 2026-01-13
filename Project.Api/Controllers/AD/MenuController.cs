using Microsoft.AspNetCore.Mvc;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Services.AD;

namespace Project.Api.Controllers.AD
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenuController(IMenuService service) : ControllerBase
    {
        public readonly IMenuService _service = service;

        [HttpGet("Search")]
        public async Task<IActionResult> Search([FromQuery] MenuDto filter)
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

        [HttpGet("GetMenuByUser/{userName}")]
        public async Task<IActionResult> GetMenuByUser([FromRoute] string userName)
        {
            var res = new TransferObject();
            var data = await _service.GetMenuByUser(userName);
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
        public async Task<IActionResult> Insert([FromBody] MenuDto request)
        {
            var res = new TransferObject();
            await _service.InsertMenu(request);
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
        public async Task<IActionResult> Update([FromBody] MenuDto request)
        {
            var res = new TransferObject();
            await _service.UpdateMenu(request);
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

        [HttpPut("UpdateOrder")]
        public async Task<IActionResult> UpdateOrder([FromBody] List<MenuDto> request)
        {
            var res = new TransferObject();
            await _service.UpdateOrder(request);
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

        [HttpGet("Detail/{code}")]
        public async Task<IActionResult> Detail([FromRoute] string code)
        {
            var res = new TransferObject();
            var data = await _service.GetDetail(code);
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

        [HttpDelete("Delete/{code}")]
        public async Task<IActionResult> Delete([FromRoute] string code)
        {
            var res = new TransferObject();
            await _service.Delete(code);
            if (_service.Status)
            {
                await res.GetMessage("0105", _service);
            }
            else
            {
                await res.GetMessage("0106", _service);
            }
            return Ok(res);
        }

    }
}
