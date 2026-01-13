namespace Project.Core.Statics
{
    public static class PersonalType
    {
        public const int UserHeThong = 0;
        public const int KhachMoi = 1;
        public const int NguoiThamDu = 2;

        public static string GetText(int i) => i switch
        {
            UserHeThong => "User hệ thống",
            KhachMoi => "Khách mời",
            NguoiThamDu => "Người tham dự",
            _ => string.Empty
        };
    }
}
