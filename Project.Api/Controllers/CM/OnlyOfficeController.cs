using Microsoft.AspNetCore.Mvc;
using Project.Service.Dtos.CM;
using Project.Service.Services.CM;
using System.Net.Http;

namespace Project.Api.Controllers.CM
{
    [Route("api/[controller]")]
    [ApiController]
    public class OnlyOfficeController(IFileService service) : ControllerBase
    {
        public readonly IFileService _service = service;

        [HttpPost("CallbackOnlyOffice")]
        public async Task<IActionResult> CallbackOnlyOffice([FromQuery] string fileId, [FromBody] OnlyOfficeCallbackDto model)
        {
            try
            {
                var jsonBody = System.Text.Json.JsonSerializer.Serialize(model);

                if (model.status == 1 || model.status == 4)
                {
                    return Ok(new { error = 0 });
                }

                if (model.status == 2 || model.status == 6)
                {
                    if (string.IsNullOrEmpty(model.url))
                    {
                        return Ok(new { error = 1 });
                    }

                    var httpClient = new HttpClient();
                    httpClient.Timeout = TimeSpan.FromMinutes(5);

                    using var response = await httpClient.GetAsync(model.url);

                    if (!response.IsSuccessStatusCode)
                    {
                        return Ok(new { error = 1 });
                    }

                    using var stream = await response.Content.ReadAsStreamAsync();
                    var contentLength = response.Content.Headers.ContentLength ?? stream.Length;

                    await _service.PutFileObject(fileId, stream, contentLength);

                    return Ok(new { error = 0 });
                }

                if (model.status == 3 || model.status == 7)
                {
                    return Ok(new { error = 1 });
                }

                return Ok(new { error = 0 });
            }
            catch (Exception ex)
            {
                return StatusCode(200, new { error = 0 });
            }
        }
    }
}
