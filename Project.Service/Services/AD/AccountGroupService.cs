using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Project.Core;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Dtos.AD;

namespace Project.Service.Services.AD
{
    public interface IAccountGroupService : IGenericService<AdAccountGroup, AccountGroupDto>
    {
        Task<AccountGroupDto> GetDetail(string code);
        Task UpdateAccountGroup(AccountGroupDto request);
        Task InsertAccountGroup(AccountGroupDto request);
    }

    public class AccountGroupService(AppDbContext dbContext, IMapper mapper) : GenericService<AdAccountGroup, AccountGroupDto>(dbContext, mapper), IAccountGroupService
    {
        public override async Task<PagedResponseDto> Search(AccountGroupDto filter)
        {
            try
            {
                var query = _dbContext.AdAccountGroup.AsQueryable();

                if (!string.IsNullOrWhiteSpace(filter.KeyWord))
                {
                    query = query.Where(x => x.Name.ToString().Contains(filter.KeyWord) || x.Notes.Contains(filter.KeyWord));
                }

                if (!string.IsNullOrWhiteSpace(filter.OrgId))
                {
                    query = query.Where(x => x.OrgId == filter.OrgId);
                }
                
                return await Paging(query, filter);

            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }

        public async Task<AccountGroupDto> GetDetail(string code)
        {
            try
            {
                var ent = await _dbContext.AdAccountGroup.FirstOrDefaultAsync(x => x.Id == code);
                var dto = _mapper.Map<AccountGroupDto>(ent);
                var lstRight = await _dbContext.AdAccountGroupRight.Where(x => x.GroupId == code).ToListAsync();
                dto.AccountGroupRights = lstRight.Count() > 0 
                    ? _mapper.Map<List<AccountGroupRightDto>>(lstRight)
                    : new List<AccountGroupRightDto>();
                return dto;
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
                return new AccountGroupDto();
            }
        }

        public async Task UpdateAccountGroup(AccountGroupDto request)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                await _dbContext.AdAccountGroupRight.Where(x => x.GroupId == request.Id).ExecuteDeleteAsync();

                var AccountGroupEntity = _mapper.Map<AdAccountGroup>(request);
                _dbContext.AdAccountGroup.Update(AccountGroupEntity);

                var rights = _mapper.Map<List<AdAccountGroupRight>>(request.AccountGroupRights);
                foreach (var r in rights)
                {
                    r.Id = Guid.NewGuid().ToString();
                }

                await _dbContext.AdAccountGroupRight.AddRangeAsync(rights);

                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                this.Status = false;
                this.Exception = ex;
            }
        }

        public async Task InsertAccountGroup(AccountGroupDto request)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var AccountGroupEntity = _mapper.Map<AdAccountGroup>(request);
                _dbContext.AdAccountGroup.Add(AccountGroupEntity);

                var rights = _mapper.Map<List<AdAccountGroupRight>>(request.AccountGroupRights);
                foreach (var r in rights)
                {
                    r.Id = Guid.NewGuid().ToString();
                    r.GroupId = request.Id;
                }

                await _dbContext.AdAccountGroupRight.AddRangeAsync(rights);

                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                this.Status = false;
                this.Exception = ex;
            }
        }

    }
}
