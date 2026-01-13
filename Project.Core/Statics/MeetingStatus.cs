namespace Project.Core.Statics
{
    public static class MeetingStatus
    {
        public const int ChuaBatDau = 0;
        public const int DangHop = 1;
        public const int KetThuc = 2;
        public const int KhongDienRa = 3;

        public static string GetText(int i) => i switch
        {
            ChuaBatDau => "Sắp diễn ra",
            DangHop => "Đã diễn ra",
            KetThuc => "Kết thúc",
            KhongDienRa => "Không diễn ra",
            _ => string.Empty
        };
    }
}
