using AutoMapper;
using Project.Core.Common;
using Project.Core.Entities.CM;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Project.Core.Entities.MT
{
    public class MeetingVote : BaseEntity
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string? MeetingId { get; set; }
        public string? Name { get; set; }
        public string? Notes { get; set; }
        public string? RefrenceFileId { get; set; }
        public int? Time { get; set; }
        public int? Status { get; set; }
    }

    public class MeetingVoteDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? MeetingId { get; set; }
        public string? Name { get; set; }
        public string? Notes { get; set; }
        public string? RefrenceFileId { get; set; }
        public int? Time { get; set; }
        public int? Status { get; set; }
        public DateTime? UpdateDate { get; set; }
        public List<FileDto>? Files { get; set; }
        public List<MeetingVoteResultsDto>? Results { get; set; }
        public void Mapping(Profile profile)
        {
            profile.CreateMap<MeetingVote, MeetingVoteDto>().ReverseMap();
        }
    }
}
