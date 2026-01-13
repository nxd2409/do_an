namespace Project.Core.Common
{
    public interface IBaseEntity
    {
        bool? IsActive { get; set; }
        string? CreateBy { get; set; }
        string? UpdateBy { get; set; }
        DateTime? CreateDate { get; set; }
        DateTime? UpdateDate { get; set; }
    }
    public class BaseEntity : IBaseEntity
    {
        public bool? IsActive { get; set; }
        public string? CreateBy { get; set; }
        public string? UpdateBy { get; set; }
        public DateTime? CreateDate { get; set; }
        public DateTime? UpdateDate { get; set; }
    }
}
