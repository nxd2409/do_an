using AutoMapper;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.AD
{
    public class AdAccountGroup : BaseEntity
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string? OrgId { get; set; }
        public string? Name { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class AccountGroupDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? OrgId { get; set; }
        public string? Name { get; set; }
        public string? Notes { get; set; }
        public List<AccountGroupRightDto>? AccountGroupRights { get; set; } = new List<AccountGroupRightDto>();

        public void Mapping(Profile profile)
        {
            profile.CreateMap<AdAccountGroup, AccountGroupDto>().ReverseMap();
        }
    }

}
