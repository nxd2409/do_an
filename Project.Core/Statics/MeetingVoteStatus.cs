namespace Project.Core.Statics
{
    public static class MeetingVoteStatus
    {
        public const int ChuaBatDau = 0;
        public const int DangBieuQuyet = 1;
        public const int KetThuc = 2;

        public static string GetText(int i) => i switch
        {
            ChuaBatDau => "Chưa bắt đầu",
            DangBieuQuyet => "Đang biểu quyết",
            KetThuc => "Kết thúc",
            _ => string.Empty
        };
    }
}
