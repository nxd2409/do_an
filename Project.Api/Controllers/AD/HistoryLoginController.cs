using Microsoft.AspNetCore.Mvc;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Services.AD;

namespace Project.Api.Controllers.AD
{
    [Route("api/[controller]")]
    [ApiController]
    public class HistoryLoginController(IHistoryLoginService service) : ControllerBase
    {
        public readonly IHistoryLoginService _service = service;

        [HttpGet("Search")]
        public async Task<IActionResult> Search([FromQuery] HistoryLoginDto filter)
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
        public async Task<IActionResult> Insert([FromBody] HistoryLoginDto request)
        {
            var res = new TransferObject();
            await _service.Add(request);
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
        public async Task<IActionResult> Update([FromBody] HistoryLoginDto request)
        {
            var res = new TransferObject();
            await _service.Update(request);
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

        [HttpPost("Delete")]
        public async Task<IActionResult> Delete([FromBody] List<string> ids)
        {
            var res = new TransferObject();
            await _service.DeleteHistory(ids);
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
