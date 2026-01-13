using AutoMapper;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.AD
{
    public class AdAccountGroupRight : BaseEntity
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string? GroupId { get; set; }
        public string? RightId { get; set; }
    }

    public class AccountGroupRightDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? GroupId { get; set; }
        public string? RightId { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<AdAccountGroupRight, AccountGroupRightDto>().ReverseMap();
        }
    }
}
