using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Project.Core;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Dtos.AD;

namespace Project.Service.Services.AD
{
    public interface IAccountAccountGroupService : IGenericService<AdAccountAccountGroup, AccountAccountGroupDto>
    {
        Task Delete(AccountAccountGroupDto request);
    }

    public class AccountAccountGroupService(AppDbContext dbContext, IMapper mapper) : GenericService<AdAccountAccountGroup, AccountAccountGroupDto>(dbContext, mapper), IAccountAccountGroupService
    {
        public async Task Delete(AccountAccountGroupDto request)
        {
            try
            {
                await _dbContext.AdAccountAccountGroup.Where(x => x.UserName == request.UserName && x.GroupId == request.GroupId).ExecuteDeleteAsync();
            }
            catch(Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
            }
        }
    }
}
