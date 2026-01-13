using Microsoft.AspNetCore.Mvc;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Services.AD;

namespace Project.Api.Controllers.AD
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountAccountGroupController(IAccountAccountGroupService service) : ControllerBase
    {
        public readonly IAccountAccountGroupService _service = service;

        [HttpPost("Insert")]
        public async Task<IActionResult> Insert([FromBody] AccountAccountGroupDto request)
        {
            var res = new TransferObject();
            request.Id = Guid.NewGuid().ToString();
            await _service.Add(request);
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
        public async Task<IActionResult> Delete([FromBody] AccountAccountGroupDto request)
        {
            var res = new TransferObject();
            request.Id = Guid.NewGuid().ToString();
            await _service.Delete(request);
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

    }
}
