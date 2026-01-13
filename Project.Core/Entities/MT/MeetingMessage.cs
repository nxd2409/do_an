using AutoMapper;
using Project.Core.Common;
using Project.Core.Entities.AD;
using Project.Core.Entities.CM;
using Project.Core.Entities.MD;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Project.Core.Entities.MT
{
    public class MeetingMessage : BaseEntity
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string? MeetingId { get; set; }
        public string? SenderUserId { get; set; }
        public string? ReceiverUserId { get; set; }
        public string? MessageText { get; set; }
    }

    public class MeetingMessageDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? MeetingId { get; set; }
        public string? SenderUserId { get; set; }
        public string? ReceiverUserId { get; set; }
        public string? MessageText { get; set; }
        public DateTime? CreateDate { get; set; }
        public AdAccount? User { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<MeetingMessage, MeetingMessageDto>().ReverseMap();
        }
    }
}
