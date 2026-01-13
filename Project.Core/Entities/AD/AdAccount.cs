using AutoMapper;
using Project.Core.Common;
using Project.Core.Entities.MD;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.AD
{
    public class AdAccount : BaseEntity
    {
        [Key]
        public string UserName { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? Password { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? OrgId { get; set; }
        public string? TitleCode { get; set; }
        public string? FaceId { get; set; }
        public virtual MdTitle? Title { get; set; }
    }

    public class AccountDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? OrgId { get; set; }
        public string? TitleCode { get; set; }
        public string? FaceId { get; set; }
        public List<AdAccountGroup>? AccountGroups { get; set; }
        public List<string>? Rights { get; set; }
        public virtual MdTitle? Title { get; set; }

        public void Mapping(Profile profile)
        {
            profile.CreateMap<AdAccount, AccountDto>();

            profile.CreateMap<AccountDto, AdAccount>()
                .ForMember(dest => dest.Title, opt => opt.Ignore());

        }
    }

    public class ChangePasswordDto
    {
        public string? UserName { get; set; }
        public string? CurrentPassword { get; set; }
        public string? NewPassword { get; set; }
        public string? ConfirmNewPassword { get; set; }
    }
}
