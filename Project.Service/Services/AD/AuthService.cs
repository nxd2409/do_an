using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Project.Core;
using Project.Core.Entities.AD;
using Project.Service.Common;
using Project.Service.Dtos.AD;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using UAParser;
using Project.Core.Statics;
using Project.Core.Entities.MT;

namespace Project.Service.Services.AD
{
    public interface IAuthService : IGenericService<AdAccount, AccountDto>
    {
        Task<JWTTokenDto?> Login(LoginDto loginInfo, HttpRequest request);
        Task<JWTTokenDto?> JoinAsGuest(JoinAsGuestDto request);
        Task<JWTTokenDto?> LoginFace(string faceId, HttpRequest request);
    }

    public class AuthService(AppDbContext dbContext, IMapper mapper, IConfiguration configuration) : GenericService<AdAccount, AccountDto>(dbContext, mapper), IAuthService
    {
        private readonly IConfiguration _configuration = configuration;

        public async Task<JWTTokenDto?> Login(LoginDto loginInfo, HttpRequest request)
        {
            var userAgentString = request.Headers["User-Agent"].ToString();
            var ipAddress = request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

            var uaParser = Parser.GetDefault();
            ClientInfo clientInfo = uaParser.Parse(userAgentString);

            var history = new AdHistoryLogin
            {
                Id = Guid.NewGuid().ToString(),
                UserName = loginInfo.Username,
                LogonTime = DateTime.UtcNow,
                Browser = clientInfo.UA.Family,
                Version = $"{clientInfo.UA.Major}.{clientInfo.UA.Minor}.{clientInfo.UA.Patch}",
                Os = $"{clientInfo.OS.Family} {clientInfo.OS.Major}.{clientInfo.OS.Minor}",
                IsMobile = userAgentString.ToLower().Contains("mobile") || clientInfo.Device.Family.ToLower() != "other",
                IpAddress = ipAddress,
                MobileModel = clientInfo.Device.Model,
                Manufacturer = clientInfo.Device.Brand,
            };

            try
            {
                if (string.IsNullOrWhiteSpace(loginInfo.Username) || string.IsNullOrWhiteSpace(loginInfo.Password))
                {
                    history.Status = false;
                    history.Reason = "Thiếu tên đăng nhập hoặc mật khẩu";
                    await _dbContext.AdHistoryLogin.AddAsync(history);
                    await _dbContext.SaveChangesAsync();

                    Status = false;
                    MessageObject.Message = "Đăng nhập không thành công!";
                    MessageObject.MessageDetail = "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!";
                    MessageObject.Code = "ERR";
                    return new JWTTokenDto();
                }

                var account = await _dbContext.AdAccount.FirstOrDefaultAsync(x =>
                    x.UserName.ToLower() == loginInfo.Username.ToLower()
                    && x.Password == CryptographyMD5(loginInfo.Password));

                if (account == null)
                {
                    history.Status = false;
                    history.Reason = "Sai tên đăng nhập hoặc mật khẩu";
                    await _dbContext.AdHistoryLogin.AddAsync(history);
                    await _dbContext.SaveChangesAsync();

                    Status = false;
                    MessageObject.Message = "Đăng nhập không thành công!";
                    MessageObject.MessageDetail = "Sai tên đăng nhập hoặc mật khẩu! Vui lòng kiểm tra lại!";
                    MessageObject.Code = "ERR";
                    return new JWTTokenDto();
                }

                if (account.IsActive != true)
                {
                    history.Status = false;
                    history.Reason = "Tài khoản bị khoá";
                    await _dbContext.AdHistoryLogin.AddAsync(history);
                    await _dbContext.SaveChangesAsync();

                    Status = false;
                    MessageObject.Message = "Đăng nhập không thành công!";
                    MessageObject.MessageDetail = "Tài khoản đã bị khoá! Vui lòng liên hệ với quản trị viên hệ thống!";
                    MessageObject.Code = "ERR";
                    return new JWTTokenDto();
                }

                history.Status = true;
                var dto = _mapper.Map<AccountDto>(account);
                var token = GeneratenJwtToken(dto.UserName, dto.FullName);

                await _dbContext.AdHistoryLogin.AddAsync(history);
                await _dbContext.SaveChangesAsync();

                return new JWTTokenDto()
                {
                    AccountInfo = dto,
                    AccessToken = token.Item1,
                    ExpireDate = token.Item2,
                };
            }
            catch (Exception ex)
            {
                history.Status = false;
                history.Reason = "Lỗi hệ thống: " + ex.Message;
                await _dbContext.AdHistoryLogin.AddAsync(history);
                await _dbContext.SaveChangesAsync();

                this.Status = false;
                this.Exception = ex;
                return new JWTTokenDto();
            }
        }

        public async Task<JWTTokenDto?> LoginFace(string faceId, HttpRequest request)
        {
            var userAgentString = request.Headers["User-Agent"].ToString();
            var ipAddress = request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

            var uaParser = Parser.GetDefault();
            ClientInfo clientInfo = uaParser.Parse(userAgentString);

            var history = new AdHistoryLogin
            {
                Id = Guid.NewGuid().ToString(),
                LogonTime = DateTime.UtcNow,
                Browser = clientInfo.UA.Family,
                Version = $"{clientInfo.UA.Major}.{clientInfo.UA.Minor}.{clientInfo.UA.Patch}",
                Os = $"{clientInfo.OS.Family} {clientInfo.OS.Major}.{clientInfo.OS.Minor}",
                IsMobile = userAgentString.ToLower().Contains("mobile") || clientInfo.Device.Family.ToLower() != "other",
                IpAddress = ipAddress,
                MobileModel = clientInfo.Device.Model,
                Manufacturer = clientInfo.Device.Brand,
            };

            try
            {

                var account = await _dbContext.AdAccount.FirstOrDefaultAsync(x => x.FaceId == faceId);

                if (account == null || account.IsActive != true)
                {
                    history.Status = false;
                    this.Status = false;
                    return new JWTTokenDto();
                }

                history.Status = true;
                history.UserName = account.UserName;
                var dto = _mapper.Map<AccountDto>(account);
                var token = GeneratenJwtToken(dto.UserName, dto.FullName);

                await _dbContext.AdHistoryLogin.AddAsync(history);
                await _dbContext.SaveChangesAsync();

                return new JWTTokenDto()
                {
                    AccountInfo = dto,
                    AccessToken = token.Item1,
                    ExpireDate = token.Item2,
                };
            }
            catch (Exception ex)
            {
                history.Status = false;
                history.Reason = "Lỗi hệ thống: " + ex.Message;
                await _dbContext.AdHistoryLogin.AddAsync(history);
                await _dbContext.SaveChangesAsync();

                this.Status = false;
                this.Exception = ex;
                return new JWTTokenDto();
            }
        }

        public async Task<JWTTokenDto?> JoinAsGuest(JoinAsGuestDto request)
        {
            try
            {
                var personal = new Core.Entities.MT.MeetingPersonal
                {
                    Id = Guid.NewGuid().ToString(),
                    UserName = Guid.NewGuid().ToString(),
                    MeetingId = request.MeetingId,
                    FullName = request.Name,
                    Password = CryptographyMD5("12345678"),
                    RefrenceFileId = Guid.NewGuid().ToString(),
                    Type = PersonalType.NguoiThamDu,
                    IsChuTri = false,
                    IsThuKy = false,
                    IsParticipateInVoting = false,
                    IsJoined = true,
                    JoinTime = DateTime.Now,
                };
                _dbContext.MeetingPersonal.Add(personal);
                await _dbContext.SaveChangesAsync();

                var dto = _mapper.Map<MeetingPersonalDto>(personal);
                var token = GeneratenJwtToken(dto.UserName, dto.FullName);

                return new JWTTokenDto()
                {
                    AccountInfo = dto,
                    AccessToken = token.Item1,
                    ExpireDate = token.Item2,
                };

            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
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

        private (string, DateTime) GeneratenJwtToken(string? userName, string? fullName)
        {
            var claims = new[] {
                        new Claim(JwtRegisteredClaimNames.Sub, _configuration["Jwt:Subject"] ?? string.Empty),
                        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                        new Claim(JwtRegisteredClaimNames.Iat, new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString()),
                        new Claim(ClaimTypes.Name, userName ?? string.Empty),
                        new Claim(ClaimTypes.GivenName ,fullName ?? "" ),
                    };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? string.Empty));

            var expire = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:ExpireToken"] ?? string.Empty));

            var signIn = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var jwtSecurityToken = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                claims,
                expires: expire,
                signingCredentials: signIn);

            var token = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
            return new(token, expire);
        }
    }
}
