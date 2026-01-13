namespace Project.Service.Dtos.CM
{
    public class NotifyRequest
    {
        public string MeetingId { get; set; } = "";
        public string Username { get; set; } = "";
        public string Action { get; set; } = "";
        public string Message { get; set; } = "";
        public bool Value { get; set; } = true;
    }

    public class MultiNotifyRequest
    {
        public string MeetingId { get; set; } = "";
        public List<string> Usernames { get; set; } = new();
        public string Action { get; set; } = "";
        public string Message { get; set; } = "";
    }
}
