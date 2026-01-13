using AutoMapper;
using Project.Core.Common;
using Project.Core.Entities.AD;
using Project.Core.Entities.CM;
using Project.Core.Entities.MD;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Project.Core.Entities.MT
{
    public class MeetingPersonal : BaseEntity
    {
        public string Id { get; set; } = string.Empty;
        public string? MeetingId { get; set; }
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? Password { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? OrgId { get; set; }
        public string? TitleCode { get; set; }
        public string? FaceId { get; set; }
        public string? RefrenceFileId { get; set; }
        public int? Type { get; set; }
        public bool? IsChuTri { get; set; }
        public bool? IsThuKy { get; set; }
        public bool? IsParticipateInVoting { get; set; }
        public bool? IsJoined { get; set; }
        public DateTime? JoinTime { get; set; }
        public virtual MdTitle? Title { get; set; }
    }

    public class MeetingPersonalDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? PId { get; set; }
        public string? MeetingId { get; set; }
        public bool? Expanded { get; set; } = true;
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? Password { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? OrgId { get; set; }
        public string? TitleCode { get; set; }
        public string? FaceId { get; set; }
        public string? RefrenceFileId { get; set; }
        public int? Type { get; set; }
        public bool? IsChuTri { get; set; }
        public bool? IsThuKy { get; set; }
        public bool? IsThanhVien { get; set; }
        public bool? IsParticipateInVoting { get; set; }
        public string? TypeBuildTree { get; set; }
        public bool? IsJoined { get; set; }
        public DateTime? JoinTime { get; set; }
        public MdTitle? Title { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<MeetingPersonal, AdAccount>().ReverseMap();

            profile.CreateMap<MeetingPersonal, MeetingPersonalDto>();

            profile.CreateMap<MeetingPersonalDto, MeetingPersonal>()
                .ForMember(dest => dest.Title, opt => opt.Ignore());

            profile.CreateMap<AdAccount, MeetingPersonalDto>();

            profile.CreateMap<MeetingPersonalDto, AdAccount>()
                .ForMember(dest => dest.Title, opt => opt.Ignore());
        }
    }
}
