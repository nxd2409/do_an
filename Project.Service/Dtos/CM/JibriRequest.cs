using Microsoft.AspNetCore.Http;
namespace Project.Service.Dtos.CM
{

    public class JibriRequest
    {
        public List<IFormFile>? Files { get; set; }
        public string? MeetingId { get; set; }
    }
}
