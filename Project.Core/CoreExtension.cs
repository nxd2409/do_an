using AutoMapper;
using AutoMapper.Extensions.ExpressionMapping;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Project.Core.Entities;

namespace Project.Core
{
    public static class CoreExtension
    {
        public static IServiceCollection AddDIServicesCore(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddAutoMapper(cfg => { cfg.AddExpressionMapping(); }, typeof(MappingProfileCore).Assembly);

            return services;
        }
    }
}

