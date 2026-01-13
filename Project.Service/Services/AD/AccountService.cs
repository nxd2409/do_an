using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Project.Core;
using Project.Core.Entities.AD;
using Project.Service.Common;
using System.Security.Cryptography;

namespace Project.Service.Services.AD
{
    public interface IAccountService : IGenericService<AdAccount, AccountDto>
    {
        Task InsertAccount(AccountDto request);
        Task UpdateAccountRight(AccountRightDto request);
        Task<AccountDto> GetDetail(string userName);
        Task UpdateAccount(AccountDto request);

        Task ChangePassword(ChangePasswordDto request);
    }

    public class AccountService(AppDbContext dbContext, IMapper mapper) : GenericService<AdAccount, AccountDto>(dbContext, mapper), IAccountService
    {
        public override async Task<PagedResponseDto> Search(AccountDto filter)
        {
            try
            {
                var query = _dbContext.AdAccount.AsQueryable();

                if (!string.IsNullOrWhiteSpace(filter.KeyWord))
                {
                    query = query.Where(x => x.UserName.ToString().Contains(filter.KeyWord) || x.FullName.Contains(filter.KeyWord));
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

        public async Task UpdateAccount(AccountDto request)
        {
            try
            {
                var user = await _dbContext.AdAccount.FirstOrDefaultAsync(x => x.UserName == request.UserName);
                if (user != null)
                {
                    user.FullName = request.FullName;
                    user.TitleCode = request.TitleCode;
                    user.Phone = request.Phone;
                    user.Email = request.Email;
                    user.Address = request.Address;
                    _dbContext.AdAccount.Update(user);
                    await _dbContext.SaveChangesAsync();
                }
                else
                {
                    this.Status = false;
                    this.MessageObject.Message = "Lỗi dữ liệu đầu vào";
                    this.MessageObject.MessageDetail = $"Hệ thống không tìm thấy tài khoản -{request.UserName}-";
                }
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }

        private string CryptographyMD5(string source)
        {
            byte[] buffer = System.Text.Encoding.UTF8.GetBytes(source);
            byte[] bytHash = MD5.HashData(buffer);
            string result = string.Empty;
            foreach (byte a in bytHash)
            {
                result += int.Parse(a.ToString(), System.Globalization.NumberStyles.HexNumber).ToString();
            }
            return result;
        }

        public async Task InsertAccount(AccountDto request)
        {
            try
            {
                var entity = _mapper.Map<AdAccount>(request);
                entity.Password = CryptographyMD5(request.UserName);
                entity.FaceId = Guid.NewGuid().ToString();
                await _dbContext.AdAccount.AddAsync(entity);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }

        public async Task<AccountDto> GetDetail(string userName)
        {
            try
            {
                var user = await _dbContext.AdAccount.FirstOrDefaultAsync(x => x.UserName == userName);
                if (user == null) return new AccountDto();

                var dto = _mapper.Map<AccountDto>(user);

                var lstAccountGroup = await _dbContext.AdAccountAccountGroup.Where(x => x.UserName == userName).Select(x => x.GroupId).ToListAsync();
                dto.AccountGroups = await _dbContext.AdAccountGroup.Where(x => lstAccountGroup.Contains(x.Id)).ToListAsync();

                var lstRights = await _dbContext.AdAccountGroupRight.Where(x => lstAccountGroup.Contains(x.GroupId)).Select(x => x.RightId).Distinct().ToListAsync();

                var lstAdded = await _dbContext.AdAccountRight.Where(x => x.UserName == userName && x.IsAdded == true).Select(x => x.RightId).ToListAsync();
                var lstRemoved = await _dbContext.AdAccountRight.Where(x => x.UserName == userName && x.IsRemoved == true).Select(x => x.RightId).ToListAsync();

                dto.Rights = lstRights.Union(lstAdded).Except(lstRemoved).Distinct().ToList();

                return dto;
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return new AccountDto();
            }
        }

        public async Task UpdateAccountRight(AccountRightDto request)
        {
            try
            {
                var check = await _dbContext.AdAccountRight.FirstOrDefaultAsync(x => x.UserName == request.UserName && x.RightId == request.RightId);
                if (check == null)
                {
                    var ent = _mapper.Map<AdAccountRight>(request);
                    ent.Id = Guid.NewGuid().ToString();
                    await _dbContext.AdAccountRight.AddAsync(ent);
                }
                else
                {
                    check.IsAdded = request.IsAdded;
                    check.IsRemoved = request.IsRemoved;
                    _dbContext.AdAccountRight.Update(check);
                }
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
            }
        }

        public async Task ChangePassword(ChangePasswordDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.UserName))
                {
                    Status = false;
                    MessageObject.Message = "Lỗi dữ liệu";
                    MessageObject.MessageDetail = "Tên tài khoản không được để trống";
                    return;
                }

                if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                {
                    Status = false;
                    MessageObject.Message = "Lỗi dữ liệu";
                    MessageObject.MessageDetail = "Mật khẩu hiện tại không được để trống";
                    return;
                }

                if (string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    Status = false;
                    MessageObject.Message = "Lỗi dữ liệu";
                    MessageObject.MessageDetail = "Mật khẩu mới không được để trống";
                    return;
                }

                if (string.IsNullOrWhiteSpace(request.ConfirmNewPassword))
                {
                    Status = false;
                    MessageObject.Message = "Lỗi dữ liệu";
                    MessageObject.MessageDetail = "Xác nhận mật khẩu không được để trống";
                    return;
                }

                if (request.NewPassword != request.ConfirmNewPassword)
                {
                    Status = false;
                    MessageObject.Message = "Lỗi xác nhận";
                    MessageObject.MessageDetail = "Mật khẩu mới và xác nhận mật khẩu không khớp";
                    return;
                }

                var user = await _dbContext.AdAccount.FirstOrDefaultAsync(x => x.UserName == request.UserName);
                if (user == null)
                {
                    Status = false;
                    MessageObject.Message = "Lỗi tài khoản";
                    MessageObject.MessageDetail = $"Không tìm thấy tài khoản: {request.UserName}";
                    return;
                }

                string hashedCurrentPassword = CryptographyMD5(request.CurrentPassword);
                if (user.Password != hashedCurrentPassword)
                {
                    Status = false;
                    MessageObject.Message = "Lỗi xác thực";
                    MessageObject.MessageDetail = "Mật khẩu hiện tại không đúng";
                    return;
                }

                string hashedNewPassword = CryptographyMD5(request.NewPassword);
                if (user.Password == hashedNewPassword)
                {
                    Status = false;
                    MessageObject.Message = "Lỗi dữ liệu";
                    MessageObject.MessageDetail = "Mật khẩu mới không được trùng với mật khẩu cũ";
                    return;
                }

                // 6. Validate độ mạnh mật khẩu (optional - có thể thêm)
                if (request.NewPassword.Length < 6)
                {
                    Status = false;
                    MessageObject.Message = "Lỗi mật khẩu";
                    MessageObject.MessageDetail = "Mật khẩu mới phải có ít nhất 6 ký tự";
                    return;
                }

                user.Password = hashedNewPassword;
                _dbContext.AdAccount.Update(user);
                await _dbContext.SaveChangesAsync();
                Status = true;
 
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                MessageObject.Message = "Lỗi hệ thống";
                MessageObject.MessageDetail = ex.Message;
            }
        }
    }
}
