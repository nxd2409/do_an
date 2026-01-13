namespace Project.Core.Statics
{
    public static class MeetingVoteAnswer
    {
        public const int TanThanh = 0;
        public const int KhongTanThanh = 1;
        public const int KhongBieuQuyet = 2;

        public static string GetText(int i) => i switch
        {
            TanThanh => "Tán thành",
            KhongTanThanh => "Không tán thành",
            KhongBieuQuyet => "Không biểu quyết",
            _ => string.Empty
        };
    }
}
