using AutoMapper;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.AD
{
    public class AdMessage : BaseEntity
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        public string? Lang { get; set; }
        public string? Message { get; set; }
        public string? Type { get; set; }
    }

    public class MessageDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Code { get; set; }
        public string? Lang { get; set; }
        public string? Message { get; set; }
        public string? Type { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<AdMessage, MessageDto>().ReverseMap();
        }
    }
}
