using AutoMapper;
using Project.Core;

namespace Project.Service.Common
{
    public interface IBaseService
    {
        MessageObject MessageObject { get; set; }
        Exception Exception { get; set; }
        bool Status { get; set; }
    }

    public class BaseService(AppDbContext dbContext, IMapper mapper) : IBaseService
    {
        public AppDbContext _dbContext = dbContext;
        public MessageObject MessageObject { get; set; } = new MessageObject();
        public Exception Exception { get; set; }
        public bool Status { get; set; } = true;
        public IMapper _mapper = mapper;
    }
}
