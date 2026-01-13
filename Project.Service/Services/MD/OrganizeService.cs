using AutoMapper;
using Project.Core;
using Project.Core.Entities.MD;
using Project.Service.Common;

namespace Project.Service.Services.MD
{
    public interface IOrganizeService : IGenericService<MdOrganize, OrganizeDto>
    {
        Task UpdateOrder(List<OrganizeDto> request);
    }

    public class OrganizeService(AppDbContext dbContext, IMapper mapper) : GenericService<MdOrganize, OrganizeDto>(dbContext, mapper), IOrganizeService
    {
        public async Task UpdateOrder(List<OrganizeDto> request)
        {
            try
            {
                var entity = _mapper.Map<List<MdOrganize>>(request);
                _dbContext.MdOrganize.UpdateRange(entity);
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
