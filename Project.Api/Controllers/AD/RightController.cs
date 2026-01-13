using Microsoft.AspNetCore.Mvc;
using Minio.DataModel.Select;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Services.AD;

namespace Project.Api.Controllers.AD
{
    [Route("api/[controller]")]
    [ApiController]
    public class RightController(IRightService service) : ControllerBase
    {
        public readonly IRightService _service = service;

        [HttpGet("Search")]
        public async Task<IActionResult> Search([FromQuery] RightDto filter)
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

        [HttpGet("GetRightOfUser")]
        public async Task<IActionResult> GetRightOfUser(string userName)
        {
            var transferObject = new TransferObject();
            var result = await _service.GetRightOfUser(userName);
            if (_service.Status)
            {
                transferObject.Data = result;
            }
            else
            {
                transferObject.Status = false;
                await transferObject.GetMessage("0001", _service);
            }
            return Ok(transferObject);
        }

        [HttpPost("Insert")]
        public async Task<IActionResult> Insert([FromBody] RightDto request)
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
        public async Task<IActionResult> Update([FromBody] RightDto request)
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

        [HttpPut("UpdateOrder")]
        public async Task<IActionResult> UpdateOrder([FromBody] List<RightDto> request)
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
            var data = await _service.GetById(code);
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
