using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Project.Core;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Dtos.AD;

namespace Project.Service.Services.AD
{
    public interface IMenuService : IGenericService<AdMenu, MenuDto>
    {
        Task<MenuDto> GetDetail(string code);
        Task<List<MenuDto>> GetMenuByUser(string userName);
        Task UpdateMenu(MenuDto request);
        Task InsertMenu(MenuDto request);
        Task UpdateOrder(List<MenuDto> request);
    }

    public class MenuService(AppDbContext dbContext, IMapper mapper) : GenericService<AdMenu, MenuDto>(dbContext, mapper), IMenuService
    {
        public async Task<MenuDto> GetDetail(string code)
        {
            try
            {
                var ent = await _dbContext.AdMenu.FirstOrDefaultAsync(x => x.Id == code);
                var dto = _mapper.Map<MenuDto>(ent);
                var lstRightMenu = await _dbContext.AdMenuRight.Where(x => x.MenuId == code).ToListAsync();
                dto.MenuRights = _mapper.Map<List<MenuRightDto>>(lstRightMenu);
                return dto;
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
                return new MenuDto();
            }
        }

        public async Task<List<MenuDto>> GetMenuByUser(string userName)
        {
            var user = _dbContext.AdAccount.FirstOrDefault(x => x.UserName == userName);
            var rights = new List<string>();
            if (user.OrgId == "ORG1")
            {
                rights = await _dbContext.AdRight.OrderBy(x => x.Id).Select(x => x.Id).ToListAsync();
            }
            else
            {
                var lstAccountGroup = await _dbContext.AdAccountAccountGroup.Where(x => x.UserName == userName).Select(x => x.GroupId).ToListAsync();
                var AccountGroups = await _dbContext.AdAccountGroup.Where(x => lstAccountGroup.Contains(x.Id)).Select(x => x.Id).ToListAsync();
                var groupRightS = await _dbContext.AdAccountGroupRight.Where(x => AccountGroups.Contains(x.GroupId)).Select(x => x.RightId).ToListAsync();

                var accountRights = await _dbContext.AdAccountRight.Where(x => x.UserName == userName && x.IsAdded == true).Select(x => x.RightId).Distinct().ToListAsync();
                rights = accountRights.Concat(groupRightS).Distinct().ToList();
            }


            if (!rights.Any())
                return new List<MenuDto>();

            var menus = await _dbContext.AdMenu.Where(x => (_dbContext.AdMenuRight.Where(x => rights.Contains(x.RightId)).Select(x => x.MenuId).ToList()).Contains(x.Id)).Distinct().ToListAsync();

            return _mapper.Map<List<MenuDto>>(menus);
        }

        public async Task UpdateMenu(MenuDto request)
        {

            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                await _dbContext.AdMenuRight.Where(x => x.MenuId == request.Id).ExecuteDeleteAsync();

                var menuEntity = _mapper.Map<AdMenu>(request);
                _dbContext.AdMenu.Update(menuEntity);

                var rights = _mapper.Map<List<AdMenuRight>>(request.MenuRights);
                foreach (var r in rights)
                {
                    r.Id = Guid.NewGuid().ToString();
                }

                await _dbContext.AdMenuRight.AddRangeAsync(rights);

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

        public async Task InsertMenu(MenuDto request)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var menuEntity = _mapper.Map<AdMenu>(request);
                _dbContext.AdMenu.Add(menuEntity);

                var rights = _mapper.Map<List<AdMenuRight>>(request.MenuRights);
                foreach (var r in rights)
                {
                    r.Id = Guid.NewGuid().ToString();
                    r.MenuId = request.Id;
                }

                await _dbContext.AdMenuRight.AddRangeAsync(rights);

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

        public async Task UpdateOrder(List<MenuDto> request)
        {
            try
            {
                var entity = _mapper.Map<List<AdMenu>>(request);
                _dbContext.AdMenu.UpdateRange(entity);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
            }
        }

    }
}
