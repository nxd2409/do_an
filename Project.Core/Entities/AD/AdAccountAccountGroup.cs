using AutoMapper;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.AD
{
    public class AdAccountAccountGroup : BaseEntity
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string? UserName { get; set; }
        public string? GroupId { get; set; }
    }

    public class AccountAccountGroupDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? UserName { get; set; }
        public string? GroupId { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<AdAccountAccountGroup, AccountAccountGroupDto>().ReverseMap();
        }
    }
}
