using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Project.Core;
using Project.Core.Common;
using Project.Core.Entities.MD;
using Project.Service.Common;

namespace Project.Service.Services.MD
{
    public interface IRoomService : IGenericService<MdRoom, RoomDto>
    {
    }

    public class RoomService(AppDbContext dbContext, IMapper mapper) : GenericService<MdRoom, RoomDto>(dbContext, mapper), IRoomService
    {
        // Override GetById để lấy kèm Items
        public override async Task<RoomDto> GetById(object id)
        {
            try
            {
                var code = id.ToString();
                var room = await _dbContext.MdRoom
                    .FirstOrDefaultAsync(r => r.Code == code);

                if (room == null)
                {
                    Status = false;
                    return null;
                }

                var roomDto = _mapper.Map<RoomDto>(room);

                // Lấy Items
                var items = await _dbContext.MdRoomItem
                    .Where(i => i.RoomId == code)
                    .OrderBy(i => i.CreateDate)
                    .ToListAsync();

                roomDto.Items = _mapper.Map<List<RoomItemDto>>(items);

                Status = true;
                return roomDto;
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }

        // Override Add để thêm cả Items
        public override async Task Add(IDto dto)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var roomDto = dto as RoomDto;
                if (roomDto == null)
                {
                    Status = false;
                    return;
                }

                // Insert Room
                var room = _mapper.Map<MdRoom>(roomDto);
                room.CreateDate = DateTime.Now;
                room.IsActive = true;

                await _dbContext.MdRoom.AddAsync(room);
                await _dbContext.SaveChangesAsync();

                // Insert RoomItems
                if (roomDto.Items != null && roomDto.Items.Any())
                {
                    foreach (var itemDto in roomDto.Items)
                    {
                        var item = _mapper.Map<MdRoomItem>(itemDto);
                        item.RoomId = room.Code;
                        item.CreateDate = DateTime.Now;
                        item.IsActive = true;

                        await _dbContext.MdRoomItem.AddAsync(item);
                    }
                    await _dbContext.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                Status = true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Status = false;
                Exception = ex;
            }
        }

        // Override Update để cập nhật cả Items
        public override async Task Update(IDto dto)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var roomDto = dto as RoomDto;
                if (roomDto == null)
                {
                    Status = false;
                    return;
                }

                // Update Room
                var room = await _dbContext.MdRoom
                    .FirstOrDefaultAsync(r => r.Code == roomDto.Code);

                if (room == null)
                {
                    Status = false;
                    Exception = new Exception("Room not found");
                    return;
                }

                room.Name = roomDto.Name;
                room.Width = roomDto.Width;
                room.Height = roomDto.Height;
                room.Address = roomDto.Address;
                room.ChairCount = roomDto.ChairCount;
                room.TableType = roomDto.TableType;
                room.WsStreamUrl = roomDto.WsStreamUrl;
                room.UpdateDate = DateTime.Now;

                _dbContext.MdRoom.Update(room);
                await _dbContext.SaveChangesAsync();

                // Delete old items
                var oldItems = await _dbContext.MdRoomItem
                    .Where(i => i.RoomId == roomDto.Code)
                    .ToListAsync();

                if (oldItems.Any())
                {
                    _dbContext.MdRoomItem.RemoveRange(oldItems);
                    await _dbContext.SaveChangesAsync();
                }

                // Insert new items
                if (roomDto.Items != null && roomDto.Items.Any())
                {
                    foreach (var itemDto in roomDto.Items)
                    {
                        var item = _mapper.Map<MdRoomItem>(itemDto);
                        item.RoomId = room.Code;
                        item.CreateDate = DateTime.Now;
                        item.IsActive = true;

                        await _dbContext.MdRoomItem.AddAsync(item);
                    }
                    await _dbContext.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                Status = true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Status = false;
                Exception = ex;
            }
        }

        // Override Delete để xóa cả Items
        public override async Task Delete(object code)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var codeStr = code.ToString();

                // Xóa items trước
                var items = await _dbContext.MdRoomItem
                    .Where(i => i.RoomId == codeStr)
                    .ToListAsync();

                if (items.Any())
                {
                    _dbContext.MdRoomItem.RemoveRange(items);
                    await _dbContext.SaveChangesAsync();
                }

                // Xóa room
                var room = await _dbContext.MdRoom
                    .FirstOrDefaultAsync(r => r.Code == codeStr);

                if (room == null)
                {
                    Status = false;
                    MessageObject.Code = "0000";
                    return;
                }

                _dbContext.MdRoom.Remove(room);
                await _dbContext.SaveChangesAsync();

                await transaction.CommitAsync();
                Status = true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Status = false;
                Exception = ex;
            }
        }
    }
}