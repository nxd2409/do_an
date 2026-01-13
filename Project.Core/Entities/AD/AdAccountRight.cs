using AutoMapper;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.AD
{
    public class AdAccountRight : BaseEntity
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string? UserName { get; set; }
        public string? RightId { get; set; }
        public bool? IsAdded { get; set; }
        public bool? IsRemoved { get; set; }
    }

    public class AccountRightDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? UserName { get; set; }
        public string? RightId { get; set; }
        public bool? IsAdded { get; set; }
        public bool? IsRemoved { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<AdAccountRight, AccountRightDto>().ReverseMap();
        }
    }
}
