using AutoMapper;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.AD
{
    public class AdMenuRight : BaseEntity
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string? MenuId { get; set; }
        public string? RightId { get; set; }
    }

    public class MenuRightDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? MenuId { get; set; }
        public string? RightId { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<AdMenuRight, MenuRightDto>().ReverseMap();
        }
    }
}
