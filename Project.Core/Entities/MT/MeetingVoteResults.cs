using AutoMapper;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.MT
{
    public class MeetingVoteResults : BaseEntity
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string? VoteId { get; set; }
        public string? Username { get; set; }
        public int? Answer { get; set; }
    }

    public class MeetingVoteResultsDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? VoteId { get; set; }
        public string? Username { get; set; }
        public int? Answer { get; set; }
        public void Mapping(Profile profile)
        {
            profile.CreateMap<MeetingVoteResults, MeetingVoteResultsDto>().ReverseMap();
        }
    }
}
