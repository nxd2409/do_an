using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Project.Core.Common;

namespace Project.Core.Entities.MD
{

    public class MdRoomItem : BaseEntity
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string? RoomId { get; set; }
        public string? Type { get; set; }
        public string? Style { get; set; }
        public string? X { get; set; }
        public string? Y { get; set; }
        public string? Width { get; set; }
        public string? Height { get; set; }
        public string? Rotation { get; set; }
    }

    public class RoomItemDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? RoomId { get; set; }
        public string? Type { get; set; }
        public string? Style { get; set; }
        public string? X { get; set; }
        public string? Y { get; set; }
        public string? Width { get; set; }
        public string? Height { get; set; }
        public string? Rotation { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<MdRoomItem, RoomItemDto>().ReverseMap();
        }
    }
}
