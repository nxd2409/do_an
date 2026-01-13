namespace Project.Service.Dtos.AD
{
    public class LoginDto
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
    }

    public class JoinAsGuestDto
    {
        public string? Name { get; set; }
        public string? MeetingId { get; set; }
    }
}
