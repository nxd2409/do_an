using AutoMapper;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.MT
{
    public class MeetingRoomLayout : BaseEntity
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string? MeetingId { get; set; }
        public string? RoomItemId { get; set; }
        public string? UserId { get; set; }
    }

    public class MeetingRoomLayoutDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? MeetingId { get; set; }
        public string? RoomItemId { get; set; }
        public string? UserId { get; set; }
        public string? UserName { get; set; }
        public string? FullName { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<MeetingRoomLayout, MeetingRoomLayoutDto>();
        }
    }
}