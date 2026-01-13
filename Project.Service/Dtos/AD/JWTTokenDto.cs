using Project.Core.Entities.AD;

namespace Project.Service.Dtos.AD
{
    public class JWTTokenDto
    {
        public string? AccessToken { get; set; }
        public DateTime? ExpireDate { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? ExpireDateRefreshToken { get; set; }
        public object? AccountInfo { get; set; }
    }
}
