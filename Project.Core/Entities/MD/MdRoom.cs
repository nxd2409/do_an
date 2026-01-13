using AutoMapper;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.MD
{
    public class MdRoom : BaseEntity
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Width { get; set; }
        public string? Height { get; set; }
        public string? Address { get; set; }
        public string? TableType { get; set; }
        public int? ChairCount { get; set; }
        public string? WsStreamUrl { get; set; }

    }

    public class RoomDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Code { get; set; }
        public string? Name { get; set; }
        public string? Width { get; set; }
        public string? Height { get; set; }
        public string? Address { get; set; }
        public string? TableType { get; set; }
        public int? ChairCount { get; set; }
        public string? WsStreamUrl { get; set; }
        public List<RoomItemDto>? Items { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<MdRoom, RoomDto>().ReverseMap();
        }
    }

   
}