using AutoMapper;
using Project.Core.Common;
using Project.Core.Entities.CM;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Project.Core.Entities.MT
{
    public class MeetingInfo : BaseEntity
    {
        public string Id { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? RoomId { get; set; }
        public DateTime? ExpectedStartTime { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? MeetContent { get; set; }
        public int? Status { get; set; }
        public string? Notes { get; set; }
        public string? RefrenceFileId { get; set; }
        public virtual ICollection<MeetingPersonal>? Personal { get; set; }
        public virtual ICollection<MeetingVote>? Votes { get; set; }
    }

    public class MeetingInfoDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? RoomId { get; set; }
        public DateTime? ExpectedStartTime { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? MeetContent { get; set; }
        public int? Status { get; set; }
        public string? Notes { get; set; }
        public string? RefrenceFileId { get; set; }
        public List<FileDto>? Files { get; set; }
        public ICollection<MeetingPersonal>? Personal { get; set; }
        public ICollection<MeetingVoteDto>? Votes { get; set; }
        public virtual List<MeetingRoomLayout>? RoomLayouts { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<MeetingInfo, MeetingInfoDto>();
            profile.CreateMap<MeetingInfoDto, MeetingInfo>()
                .ForMember(dest => dest.Personal, opt => opt.Ignore())
                .ForMember(dest => dest.Votes, opt => opt.Ignore());
        }
    }
}
