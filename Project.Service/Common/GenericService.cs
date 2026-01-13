using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Project.Core;
using Project.Core.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Project.Service.Common
{
    public interface IGenericService<TEntity, TDto> : IBaseService
        where TEntity : BaseEntity
        where TDto : BaseDto
    {
        Task<PagedResponseDto> Search(TDto filter);
        Task<IList<TDto>> GetAll();
        Task<TDto> GetById(object id);
        Task Add(IDto dto);
        Task Update(IDto dto);
        Task Delete(object code);
        Task<PagedResponseDto> Paging(IQueryable<TEntity> query, TDto filter);
    }
    public abstract class GenericService<TEntity, TDto>(AppDbContext dbContext, IMapper mapper)
        : BaseService(dbContext, mapper), IGenericService<TEntity, TDto>
        where TEntity : BaseEntity
        where TDto : BaseDto
    {
        public virtual async Task<PagedResponseDto> Search(TDto filter)
        {
            try
            {
                var query = _dbContext.Set<TEntity>().AsQueryable();

                return await Paging(query, filter);
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
        public virtual async Task<IList<TDto>> GetAll()
        {
            try
            {
                var query = _dbContext.Set<TEntity>();
                var lstEntity = await _dbContext.Set<TEntity>().ToListAsync();
                return _mapper.Map<List<TDto>>(lstEntity);
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
        public virtual async Task<TDto> GetById(object id)
        {
            try
            {
                var entity = await _dbContext.Set<TEntity>().FindAsync(id);
                return _mapper.Map<TDto>(entity);
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
        public virtual async Task Add(IDto dto)
        {
            try
            {
                var entity = _mapper.Map<TEntity>(dto);
                var keyProps = typeof(TEntity).GetProperties()
                    .Where(p => p.GetCustomAttribute<KeyAttribute>() != null)
                    .ToList();

                if (keyProps.Any())
                {
                    var param = Expression.Parameter(typeof(TEntity), "e");
                    Expression expr = null;

                    foreach (var prop in keyProps)
                    {
                        var value = prop.GetValue(entity);
                        if (value == null || (value is string s && string.IsNullOrWhiteSpace(s)))
                            throw new InvalidOperationException($"Trường thông tin '{prop.Name}' không được để trống");

                        var eq = Expression.Equal(Expression.Property(param, prop), Expression.Constant(value));
                        expr = expr == null ? eq : Expression.AndAlso(expr, eq);
                    }

                    var lambda = Expression.Lambda<Func<TEntity, bool>>(expr, param);
                    if (await _dbContext.Set<TEntity>().AnyAsync(lambda))
                    {
                        var keyValues = string.Join(", ", keyProps.Select(p => $"{p.Name} = '{p.GetValue(entity)}'"));
                        throw new InvalidOperationException($"Thông tin [{keyValues}] đã tồn tại trên hệ thống! Vui lòng nhập thông tin khác!");
                    }
                }

                await _dbContext.Set<TEntity>().AddAsync(entity);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }
        public virtual async Task Delete(object code)
        {
            try
            {
                var entity = _dbContext.Set<TEntity>().Find(code);
                if (entity == null)
                {
                    Status = false;
                    MessageObject.Code = "0000";
                    return;
                }
                _dbContext.Entry<TEntity>(entity).State = EntityState.Deleted;
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }
        public virtual async Task Update(IDto dto)
        {
            try
            {
                var entities = _mapper.Map<TEntity>(dto);
                _dbContext.Set<TEntity>().Update(entities);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }
        public virtual async Task<PagedResponseDto> Paging(IQueryable<TEntity> query, TDto filter)
        {
            try
            {
                var totalRecords = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalRecords / filter.PageSize);

                var result = filter.IsPaging == true ?
                    await query.Skip((filter.CurrentPage - 1) * filter.PageSize).Take(filter.PageSize).ToListAsync() :
                    await query.ToListAsync();

                return new PagedResponseDto
                {
                    Data = _mapper.Map<List<TDto>>(result),
                    TotalRecord = totalRecords,
                    TotalPage = totalPages,
                    CurrentPage = filter.CurrentPage,
                    PageSize = filter.PageSize
                };
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
    }
}
