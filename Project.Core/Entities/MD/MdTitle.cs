using AutoMapper;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.MD
{
    public class MdTitle : BaseEntity
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Notes { get; set; }
        public int? OrderNumber { get; set; }
    }

    public class TitleDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Code { get; set; }
        public string? Name { get; set; }
        public string? Notes { get; set; }
        public int? OrderNumber { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<MdTitle, TitleDto>().ReverseMap();
        }
    }
}
