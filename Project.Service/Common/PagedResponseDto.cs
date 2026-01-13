namespace Project.Service.Common
{
    public class PagedResponseDto
    {
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalPage { get; set; }
        public int TotalRecord { get; set; }
        public object? Data { get; set; }
        public CountMeeting? CountMeeting { get; set; } = new CountMeeting();
        public List<string>? Dates { get; set; }
    }

    public class CountMeeting
    {
        public int? SapDienRa { get; set; }
        public int? DangDienRa { get; set; }
    }
}
