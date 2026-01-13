using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Project.Core;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Dtos.AD;

namespace Project.Service.Services.AD
{
    public interface IRightService : IGenericService<AdRight, RightDto>
    {
        Task UpdateOrder(List<RightDto> request);
        Task<List<string>> GetRightOfUser(string userName);
    }

    public class RightService(AppDbContext dbContext, IMapper mapper) : GenericService<AdRight, RightDto>(dbContext, mapper), IRightService
    {
        public async Task UpdateOrder(List<RightDto> request)
        {
            try
            {
                var entity = _mapper.Map<List<AdRight>>(request);
                _dbContext.AdRight.UpdateRange(entity);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
            }
        }

        public async Task<List<string>> GetRightOfUser(string userName)
        {
            var user = _dbContext.AdAccount.FirstOrDefault(x => x.UserName == userName);

            if (user.OrgId == "ORG1")
                return await _dbContext.AdRight.OrderBy(x => x.Id).Select(x => x.Id).ToListAsync();

            var lstAccountGroup = await _dbContext.AdAccountAccountGroup.Where(x => x.UserName == userName).Select(x => x.GroupId).ToListAsync();
            var AccountGroups = await _dbContext.AdAccountGroup.Where(x => lstAccountGroup.Contains(x.Id)).Select(x => x.Id).ToListAsync();
            var groupRightS = await _dbContext.AdAccountGroupRight.Where(x => AccountGroups.Contains(x.GroupId)).Select(x => x.RightId).ToListAsync();

            var accountRights = await _dbContext.AdAccountRight.Where(x => x.UserName == userName && x.IsAdded == true).Select(x => x.RightId).ToListAsync();
            var rights = accountRights.Concat(groupRightS).Distinct().ToList();

            return rights;
        }
    }
}
