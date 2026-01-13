using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Project.Core;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Dtos.AD;

namespace Project.Service.Services.AD
{
    public interface IHistoryLoginService : IGenericService<AdHistoryLogin, HistoryLoginDto>
    {
        Task DeleteHistory(List<string> ids);
    }

    public class HistoryLoginService(AppDbContext dbContext, IMapper mapper) : GenericService<AdHistoryLogin, HistoryLoginDto>(dbContext, mapper), IHistoryLoginService
    {
        public async Task DeleteHistory(List<string> ids)
        {
            try
            {
                await _dbContext.AdHistoryLogin.Where(x => ids.Contains(x.Id)).ExecuteDeleteAsync();
                await _dbContext.SaveChangesAsync();
            }
            catch(Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
            }
        }
    }
}
