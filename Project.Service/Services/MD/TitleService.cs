using AutoMapper;
using Project.Core;
using Project.Core.Entities.MD;
using Project.Service.Common;

namespace Project.Service.Services.MD
{
    public interface ITitleService : IGenericService<MdTitle, TitleDto>
    {
    }

    public class TitleService(AppDbContext dbContext, IMapper mapper) : GenericService<MdTitle, TitleDto>(dbContext, mapper), ITitleService
    {

    }
}
