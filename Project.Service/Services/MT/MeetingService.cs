using AutoMapper;
using ClosedXML.Excel;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Minio.DataModel.Args;
using Project.Core;
using Project.Core.Entities.AD;
using Project.Core.Entities.CM;
using Project.Core.Entities.MD;
using Project.Core.Entities.MT;
using Project.Core.Statics;
using Project.Service.Common;
using System.Text;
using System.Text.Json;

namespace Project.Service.Services.MT
{
    public interface IMeetingInfoService : IGenericService<MeetingInfo, MeetingInfoDto>
    {
        Task<string> StartQuickMeeting(string name);
        Task<AccountDto?> GetAccountInfo(string username);
        Task<MeetingInfoDto?> GetInfoMeeting(string meetingId);
        Task UpdateStatusMeeting(string meetingId, int status);
        Task<List<MeetingPersonalDto>?> BuildTreeOrgAndUser();
        Task CreateMeeting(MeetingInfoDto request);
        Task SaveVoiceToText(FileDto request);
        Task<PagedResponseDto> SearchMeetingInfo(MeetingInfoDto request);
        Task<List<MeetingPersonalDto>?> GetPersonalMeeting(string meetingId);
        Task<List<MeetingVoteDto>?> GetMeetingVote(string meetingId);
        Task<MeetingVoteDto?> GetDetailVote(string voteId);
        Task<List<FileDto>?> GetListFilesCommon(string meetingId);
        Task SendMessage(MeetingMessageDto request);
        Task<List<MeetingMessageDto>?> GetListMessage(MeetingMessageDto request);
        Task CreateMeetingVote(MeetingVoteDto request);
        Task JoinMeeting(string meetingId);
        Task StartVoting(MeetingVoteDto request);
        Task EndVoting(MeetingVoteDto request);
        Task AnswerVote(MeetingVoteResultsDto request);
        Task<List<MeetingRoomLayoutDto>?> GetMeetingLayout(string meetingId);
        Task<byte[]> ExportPersonal(string meetingId);
        Task<MeetingInfoDto?> GetMeetingDetail(string meetingId);
        Task UpdateMeeting(MeetingInfoDto request);
        Task DeleteMeeting(string meetingId);
    }

    public class MeetingInfoService(AppDbContext dbContext, IMapper mapper) : GenericService<MeetingInfo, MeetingInfoDto>(dbContext, mapper), IMeetingInfoService
    {
        public string GenerateMeetingCode()
        {
            const string chars = "abcdefghijklmnopqrstuvwxyz";
            Random random = new Random();
            StringBuilder code = new StringBuilder();

            for (int i = 0; i < 3; i++)
                code.Append(chars[random.Next(chars.Length)]);
            code.Append('-');

            for (int i = 0; i < 4; i++)
                code.Append(chars[random.Next(chars.Length)]);
            code.Append('-');

            for (int i = 0; i < 3; i++)
                code.Append(chars[random.Next(chars.Length)]);

            return code.ToString();
        }
        public bool CheckMeetingIdExistsInDb(string meetingId)
        {
            return _dbContext.MeetingInfo.Any(x => x.Id == meetingId);
        }
        public async Task<string> StartQuickMeeting(string name)
        {
            try
            {
                string meetingId;
                do
                {
                    meetingId = GenerateMeetingCode();
                }
                while (CheckMeetingIdExistsInDb(meetingId));

                _dbContext.MeetingInfo.Add(new MeetingInfo
                {
                    Id = meetingId,
                    Name = name,
                    Status = MeetingStatus.ChuaBatDau,
                    ExpectedStartTime = DateTime.Now,
                    StartDate = DateTime.Now,
                    RefrenceFileId = Guid.NewGuid().ToString()
                });

                var userName = _dbContext.GetUserRequest();
                var adAccount = await _dbContext.AdAccount.FirstOrDefaultAsync(x => x.UserName == userName);

                var user = _mapper.Map<MeetingPersonal>(adAccount);
                user.Id = Guid.NewGuid().ToString();
                user.MeetingId = meetingId;
                user.RefrenceFileId = Guid.NewGuid().ToString();
                user.IsChuTri = true;
                user.Type = PersonalType.UserHeThong;

                _dbContext.MeetingPersonal.Add(user);
                await _dbContext.SaveChangesAsync();

                return meetingId;
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return string.Empty;
            }
        }
        public async Task<MeetingInfoDto?> GetInfoMeeting(string meetingId)
        {
            try
            {
                var meeting = await _dbContext.MeetingInfo
                    .FirstOrDefaultAsync(x => x.Id == meetingId);

                return meeting == null ? null : _mapper.Map<MeetingInfoDto>(meeting);
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
                return null;
            }
        }
        public async Task<AccountDto?> GetAccountInfo(string username)
        {
            try
            {
                var _account = await _dbContext.AdAccount.Include(x => x.Title).FirstOrDefaultAsync(x => x.UserName == username);
                return _account == null ? null : _mapper.Map<AccountDto>(_account);
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
                return null;
            }
        }
        public async Task<List<MeetingRoomLayoutDto>?> GetMeetingLayout(string meetingId)
        {
            try
            {
                var layouts = await _dbContext.MeetingRoomLayout
                    .Where(x => x.MeetingId == meetingId && x.IsActive == true)
                    .ToListAsync();

                if (layouts == null || !layouts.Any())
                {
                    return new List<MeetingRoomLayoutDto>();
                }

                var layoutDtos = new List<MeetingRoomLayoutDto>();

                foreach (var layout in layouts)
                {
                    // Lấy thông tin user
                    var user = await _dbContext.AdAccount
                        .Include(u => u.Title)
                        .FirstOrDefaultAsync(u => u.UserName == layout.UserId);

                    var dto = new MeetingRoomLayoutDto
                    {
                        Id = layout.Id,
                        MeetingId = layout.MeetingId,
                        RoomItemId = layout.RoomItemId,
                        UserId = layout.UserId,
                        UserName = user?.UserName,
                        FullName = user?.FullName
                    };

                    layoutDtos.Add(dto);
                }

                return layoutDtos;
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
                return null;
            }
        }
        public async Task UpdateStatusMeeting(string meetingId, int status)
        {
            try
            {
                var meeting = await _dbContext.MeetingInfo.FirstOrDefaultAsync(x => x.Id == meetingId);
                if (meeting == null)
                {
                    this.Status = false;
                    this.MessageObject.Message = "Lỗi hệ thống";
                    this.MessageObject.MessageDetail = "Không tìm thấy thông tin cuộc họp!";
                    return;
                }
                meeting.Status = status;
                if (status == MeetingStatus.DangHop)
                {
                    meeting.StartDate = DateTime.Now;
                    var personal = await _dbContext.MeetingPersonal.Where(x => x.MeetingId == meetingId && x.IsJoined == true).ToListAsync();
                    foreach (var p in personal)
                    {
                        p.JoinTime = DateTime.Now;
                    }
                    _dbContext.MeetingPersonal.UpdateRange(personal);
                }
                if (status == MeetingStatus.KetThuc)
                {
                    meeting.EndDate = DateTime.Now;
                }
                _dbContext.MeetingInfo.Update(meeting);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
            }
        }
        public async Task<List<MeetingPersonalDto>?> BuildTreeOrgAndUser()
        {
            try
            {
                var data = new List<MeetingPersonalDto>();
                var orgs = await _dbContext.MdOrganize.OrderBy(x => x.OrderNumber).ToListAsync();

                var lstIdOrg = orgs.Select(x => x.Id).ToList();
                var _users = await _dbContext.AdAccount.Where(x => lstIdOrg.Contains(x.OrgId)).ToListAsync();
                var users = _mapper.Map<List<MeetingPersonalDto>>(_users);

                foreach (var u in users)
                {
                    u.Id = Guid.NewGuid().ToString();
                    u.PId = u.OrgId;
                    u.RefrenceFileId = Guid.NewGuid().ToString();
                    u.Type = PersonalType.UserHeThong;
                    u.TypeBuildTree = "USER";
                    u.Title = await _dbContext.MdTitle.FirstOrDefaultAsync(x => x.Code == u.TitleCode);
                }
                data.AddRange(users.OrderBy(x => x.Title?.OrderNumber));

                foreach (var o in orgs)
                {
                    data.Add(new MeetingPersonalDto
                    {
                        Id = o.Id,
                        PId = o.PId,
                        FullName = o.Name,
                        TypeBuildTree = "ORG"
                    });
                }

                return data;
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
                return null;
            }
        }
        public async Task CreateMeeting(MeetingInfoDto request)
        {
            try
            {

                var lstCheck = await _dbContext.MeetingInfo.Where(x => x.ExpectedStartTime == request.ExpectedStartTime && x.Status != 0 && x.Status != 1).ToListAsync();

                var startTime = request.ExpectedStartTime.Value.AddHours(-3);
                var newMeetingTime = request.ExpectedStartTime.Value;
                var endTime = request.ExpectedStartTime.Value.AddHours(3);

                // 1️⃣ Check phòng họp
                var existMeetingInRoom = await _dbContext.MeetingInfo.AnyAsync(x =>
                    x.RoomId == request.RoomId
                    && (x.ExpectedStartTime >= startTime && x.ExpectedStartTime <= endTime && x.Status != MeetingStatus.KhongDienRa)
                    && x.ExpectedStartTime >= startTime
                    && x.ExpectedStartTime <= endTime
                    && x.Status != MeetingStatus.KhongDienRa
                    && (
                        x.EndDate == null
                        || x.EndDate >= newMeetingTime
                    )
                );

                if (existMeetingInRoom)
                {
                    this.MessageObject.Message = "Phòng họp đã có cuộc họp khác trong khoảng thời gian này.";
                    this.MessageObject.Code = "1";
                    this.Status = false;
                    return;
                }

                // 2️⃣ Check chủ trì
                var chuTriUserName = request.Personal
                    .FirstOrDefault(x => x.IsChuTri == true)
                    ?.UserName;

                if (!string.IsNullOrEmpty(chuTriUserName))
                {
                    var existChuTri = await (
                        from p in _dbContext.MeetingPersonal
                        join m in _dbContext.MeetingInfo on p.MeetingId equals m.Id
                        where p.UserName == chuTriUserName
                        where p.UserName == chuTriUserName
                              && p.IsChuTri == true
                              && m.ExpectedStartTime >= startTime
                              && m.ExpectedStartTime <= endTime
                              && m.Status != MeetingStatus.KhongDienRa
                              && (m.EndDate == null || m.EndDate >= newMeetingTime)
                        select p.FullName
                    ).FirstOrDefaultAsync();

                    if (existChuTri != null)
                    {
                        this.MessageObject.Message =
                            $"{existChuTri} đã có cuộc họp khác trong khoảng thời gian này.";
                        this.MessageObject.Code = "2";
                        this.Status = false;
                        return;
                    }
                }
                string meetingId;
                do
                {
                    meetingId = GenerateMeetingCode();
                }
                while (CheckMeetingIdExistsInDb(meetingId));
                var refrenceFileIdMeeting = Guid.NewGuid().ToString();
                var meeting = _mapper.Map<MeetingInfo>(request);
                meeting.Id = meetingId;
                meeting.Status = MeetingStatus.ChuaBatDau;
                meeting.RefrenceFileId = refrenceFileIdMeeting;

                await _dbContext.MeetingInfo.AddAsync(meeting);

                var files = _mapper.Map<List<CmFile>>(request.Files);
                foreach (var f in files)
                {
                    f.RefrenceFileId = refrenceFileIdMeeting;
                    f.Type = FileType.TaiLieu;
                }

                foreach (var p in request.Personal)
                {
                    p.MeetingId = meetingId;
                    p.Title = null;
                }

                foreach (var p in request.RoomLayouts)
                {
                    p.MeetingId = meetingId;
                }

                foreach (var v in request.Votes)
                {
                    var refrenceFileId = Guid.NewGuid().ToString();
                    v.Id = Guid.NewGuid().ToString();
                    v.Status = MeetingVoteStatus.ChuaBatDau;
                    v.RefrenceFileId = refrenceFileId;
                    v.MeetingId = meetingId;

                    foreach (var f in v.Files)
                    {
                        f.RefrenceFileId = refrenceFileId;
                        f.Type = FileType.Khac;
                    }

                    await _dbContext.MeetingVote.AddAsync(_mapper.Map<MeetingVote>(v));
                    await _dbContext.CmFile.AddRangeAsync(_mapper.Map<List<CmFile>>(v.Files));
                }

                await _dbContext.MeetingPersonal.AddRangeAsync(request.Personal);
                await _dbContext.MeetingRoomLayout.AddRangeAsync(request.RoomLayouts);
                await _dbContext.CmFile.AddRangeAsync(files);
                await _dbContext.SaveChangesAsync();

            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
            }
        }
        public async Task<PagedResponseDto> SearchMeetingInfo(MeetingInfoDto request)
        {
            try
            {
                var username = _dbContext.GetUserRequest();
                var lstIdMeeting = await _dbContext.MeetingInfo
                    .Where(x => x.CreateBy == username || x.UpdateBy == username)
                    .Select(x => x.Id)
                    .ToListAsync();

                var lstIdMeetingPersonal = await _dbContext.MeetingPersonal
                    .Where(x => x.UserName == username)
                    .Select(x => x.MeetingId)
                    .ToListAsync();

                var lstIds = lstIdMeeting
                    .Union(lstIdMeetingPersonal)
                    .Distinct()
                    .ToList();

                var lstMeeting = _dbContext.MeetingInfo
                    .Where(x => lstIds.Contains(x.Id)).Include(x => x.Personal)
                    .AsQueryable();

                var allMeetingDates = await _dbContext.MeetingInfo
                    .Where(x => lstIds.Contains(x.Id) && x.ExpectedStartTime.HasValue)
                    .Select(x => x.ExpectedStartTime.Value.Date).Distinct().OrderBy(x => x).ToListAsync();

                var meetingDatesString = allMeetingDates
                    .Select(d => d.ToString("yyyy-MM-dd"))
                    .ToList();

                if (request.ExpectedStartTime.HasValue)
                {
                    var expectedDate = request.ExpectedStartTime.Value.Date;
                    lstMeeting = lstMeeting.Where(x => x.ExpectedStartTime.HasValue
                                                        && x.ExpectedStartTime.Value.Date == expectedDate);
                }
                var count = new CountMeeting
                {
                    SapDienRa = lstMeeting.Where(x => x.Status == MeetingStatus.ChuaBatDau).Count(),
                    DangDienRa = lstMeeting.Where(x => x.Status == MeetingStatus.DangHop).Count()
                };
                if (!string.IsNullOrEmpty(request.Name))
                {
                    lstMeeting = lstMeeting.Where(x => x.Name.Contains(request.Name));
                }
                if (request.Status != null)
                {
                    lstMeeting = lstMeeting.Where(x => x.Status == request.Status);
                }
                var result = lstMeeting.OrderByDescending(x => x.ExpectedStartTime);

                var data = await this.Paging(result, request);

                data.CountMeeting = count;
                data.Dates = meetingDatesString;

                return data;
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
                return null;
            }
        }
        public async Task<List<MeetingPersonalDto>?> GetPersonalMeeting(string meetingId)
        {
            try
            {
                var personal = await _dbContext.MeetingPersonal.Where(x => x.MeetingId == meetingId).Include(x => x.Title).OrderBy(x => x.Title.OrderNumber).ToListAsync();
                return _mapper.Map<List<MeetingPersonalDto>>(personal);
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
                return null;
            }
        }
        public async Task<List<MeetingVoteDto>?> GetMeetingVote(string meetingId)
        {
            try
            {
                var _votes = await _dbContext.MeetingVote.Where(x => x.MeetingId == meetingId).ToListAsync();
                var votes = _mapper.Map<List<MeetingVoteDto>>(_votes);
                foreach (var i in votes)
                {
                    var lstFiles = await _dbContext.CmFile.Where(x => x.RefrenceFileId == i.RefrenceFileId).ToListAsync();
                    var lstResult = await _dbContext.MeetingVoteResults.Where(x => x.VoteId == i.Id).ToListAsync();
                    i.Files = _mapper.Map<List<FileDto>>(lstFiles);
                    i.Results = _mapper.Map<List<MeetingVoteResultsDto>>(lstResult);
                }
                return votes;
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
                return null;
            }
        }
        public async Task<List<FileDto>?> GetListFilesCommon(string meetingId)
        {
            try
            {
                var meeting = await _dbContext.MeetingInfo.FirstOrDefaultAsync(x => x.Id == meetingId);
                if (meeting == null)
                {
                    this.Status = false;
                    this.MessageObject.Message = "Lỗi hệ thống!";
                    this.MessageObject.MessageDetail = "Không tìm thấy thông tin file đính kèm chung từ mã cuộc họp!";
                    return null;
                }
                var files = await _dbContext.CmFile.Where(x => x.RefrenceFileId == meeting.RefrenceFileId).ToListAsync();
                return _mapper.Map<List<FileDto>>(files);
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
                return null;
            }
        }
        public async Task SendMessage(MeetingMessageDto request)
        {
            try
            {
                request.Id = Guid.NewGuid().ToString();
                var message = _mapper.Map<MeetingMessage>(request);
                await _dbContext.MeetingMessage.AddAsync(message);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }
        public async Task<List<MeetingMessageDto>?> GetListMessage(MeetingMessageDto request)
        {
            try
            {
                var lstMessage = _dbContext.MeetingMessage.Where(x => x.MeetingId == request.MeetingId).AsQueryable();
                if (!string.IsNullOrEmpty(request.SenderUserId) && !string.IsNullOrEmpty(request.ReceiverUserId))
                {
                    lstMessage = lstMessage.Where(x => (x.SenderUserId == request.SenderUserId && x.ReceiverUserId == request.ReceiverUserId) || (x.SenderUserId == request.ReceiverUserId && x.ReceiverUserId == request.SenderUserId));
                }
                else
                {
                    lstMessage = lstMessage.Where(x => string.IsNullOrEmpty(x.ReceiverUserId));
                }
                lstMessage = lstMessage.OrderBy(x => x.CreateDate);

                var data = _mapper.Map<List<MeetingMessageDto>>(lstMessage.ToList());
                foreach (var i in data)
                {
                    i.User = await _dbContext.AdAccount.FirstOrDefaultAsync(x => x.UserName == i.SenderUserId);
                }
                return data;
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
        public async Task CreateMeetingVote(MeetingVoteDto request)
        {
            try
            {
                var refrenceFileId = Guid.NewGuid().ToString();

                request.Id = Guid.NewGuid().ToString();
                request.RefrenceFileId = refrenceFileId;
                request.Status = MeetingVoteStatus.ChuaBatDau;

                await _dbContext.MeetingVote.AddAsync(_mapper.Map<MeetingVote>(request));


                foreach (var i in request.Files)
                {
                    i.RefrenceFileId = refrenceFileId;
                    i.Type = FileType.Khac;
                    await _dbContext.CmFile.AddAsync(_mapper.Map<CmFile>(i));
                }

                await _dbContext.SaveChangesAsync();

            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }
        public async Task StartVoting(MeetingVoteDto request)
        {
            try
            {
                var vote = await _dbContext.MeetingVote.FirstOrDefaultAsync(x => x.Id == request.Id);
                vote.Status = MeetingVoteStatus.DangBieuQuyet;
                _dbContext.MeetingVote.Update(vote);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }
        public async Task EndVoting(MeetingVoteDto request)
        {
            try
            {
                var vote = await _dbContext.MeetingVote.FirstOrDefaultAsync(x => x.Id == request.Id);
                if (vote.Status == MeetingVoteStatus.KetThuc)
                {
                    Status = true;
                    return;
                }
                vote.Status = MeetingVoteStatus.KetThuc;
                _dbContext.MeetingVote.Update(vote);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }
        public async Task<MeetingVoteDto?> GetDetailVote(string voteId)
        {
            try
            {
                var _vote = await _dbContext.MeetingVote.FirstOrDefaultAsync(x => x.Id == voteId);
                var vote = _mapper.Map<MeetingVoteDto>(_vote);
                vote.Files = _mapper.Map<List<FileDto>>(await _dbContext.CmFile.Where(x => x.RefrenceFileId == vote.RefrenceFileId).ToListAsync());
                vote.Results = _mapper.Map<List<MeetingVoteResultsDto>>(await _dbContext.MeetingVoteResults.Where(x => x.VoteId == vote.Id).ToListAsync());
                return vote;
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
        public async Task AnswerVote(MeetingVoteResultsDto request)
        {
            try
            {
                request.Id = Guid.NewGuid().ToString();
                var entity = _mapper.Map<MeetingVoteResults>(request);
                await _dbContext.MeetingVoteResults.AddAsync(entity);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }
        public async Task<byte[]> ExportPersonal(string meetingId)
        {
            var meetingPersonal = await _dbContext.MeetingPersonal
                .Where(x => x.MeetingId == meetingId)
                .Include(x => x.Title)
                .ToListAsync();

            var meeting = await _dbContext.MeetingInfo.FirstOrDefaultAsync(x => x.Id == meetingId);

            var possiblePaths = new[]
            {
                Path.Combine(Environment.CurrentDirectory, "Templates", "DanhSachHop.xlsx"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Templates", "DanhSachHop.xlsx"),
                Path.Combine(Directory.GetCurrentDirectory(), "Templates", "DanhSachHop.xlsx"),
                Path.Combine(AppContext.BaseDirectory,"Templates", "DanhSachHop.xlsx")
            };

            string templatePath = possiblePaths.FirstOrDefault(File.Exists) ?? possiblePaths[0];

            using var workbook = new XLWorkbook(templatePath);
            var ws = workbook.Worksheet(1);

            int startRow = 7;
            int row = startRow;
            int stt = 1;

            foreach (var p in meetingPersonal)
            {
                ws.Cell(row, 1).Value = stt;
                ws.Cell(row, 2).Value = p.FullName;
                ws.Cell(row, 3).Value = p.Title?.Name;
                ws.Cell(row, 4).Value = p.IsJoined == true ? "x" : "";
                ws.Cell(row, 5).Value = p.IsJoined != true ? "x" : "";
                ws.Cell(row, 6).Value = p.JoinTime?.ToString("dd/MM/yyyy HH:mm");
                ws.Cell(row, 7).Value = "";

                row++;
                stt++;
            }

            if (row > startRow)
            {
                var range = ws.Range(startRow, 1, row - 1, 7);
                range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            }

            if (meeting.StartDate != null)
            {
                ws.Cell(4, 1).Value = $"Thời gian: {meeting.StartDate.Value.Hour} giờ {meeting.StartDate.Value.Minute} phút, ngày {meeting.StartDate.Value.Day} tháng {meeting.StartDate.Value.Month} năm {meeting.StartDate.Value.Year}";
            }

            ws.Cell(2, 1).Value = meeting.Name;

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }
        public async Task JoinMeeting(string meetingId)
        {
            try
            {
                var meeting = await _dbContext.MeetingInfo.FirstOrDefaultAsync(x => x.Id == meetingId);
                var username = _dbContext.GetUserRequest();
                var userJoin = await _dbContext.MeetingPersonal.FirstOrDefaultAsync(x => x.UserName == username);
                if (userJoin.IsJoined != true)
                {
                    userJoin.IsJoined = true;
                    userJoin.JoinTime = DateTime.Now;
                    _dbContext.MeetingPersonal.Update(userJoin);
                    await _dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }
        public async Task SaveVoiceToText(FileDto request)
        {
            try
            {
                var file = await _dbContext.CmFile.FirstOrDefaultAsync(x => x.Id == request.Id);
                file.VoiceToText = request.VoiceToText;
                _dbContext.CmFile.Update(file);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }

        /// <summary>
        /// Lấy chi tiết đầy đủ cuộc họp để edit
        /// </summary>
        public async Task<MeetingInfoDto?> GetMeetingDetail(string meetingId)
        {
            try
            {
                var meeting = await _dbContext.MeetingInfo
                    .FirstOrDefaultAsync(x => x.Id == meetingId);

                if (meeting == null)
                {
                    Status = false;
                    MessageObject.Message = "Lỗi hệ thống";
                    MessageObject.MessageDetail = "Không tìm thấy cuộc họp!";
                    return null;
                }

                var dto = _mapper.Map<MeetingInfoDto>(meeting);

                var personal = await _dbContext.MeetingPersonal
                    .Where(x => x.MeetingId == meetingId)
                    .Include(x => x.Title)
                    .OrderBy(x => x.Title.OrderNumber)
                    .ToListAsync();

                dto.Personal = personal;

                var files = await _dbContext.CmFile
                    .Where(x => x.RefrenceFileId == meeting.RefrenceFileId)
                    .ToListAsync();

                dto.Files = _mapper.Map<List<FileDto>>(files);

                var votes = await _dbContext.MeetingVote
                    .Where(x => x.MeetingId == meetingId)
                    .ToListAsync();

                var voteDtos = _mapper.Map<List<MeetingVoteDto>>(votes);

                foreach (var vote in voteDtos)
                {
                    var voteFiles = await _dbContext.CmFile
                        .Where(x => x.RefrenceFileId == vote.RefrenceFileId)
                        .ToListAsync();

                    vote.Files = _mapper.Map<List<FileDto>>(voteFiles);
                }

                dto.Votes = voteDtos;

                var layouts = await _dbContext.MeetingRoomLayout
                    .Where(x => x.MeetingId == meetingId && x.IsActive == true)
                    .ToListAsync();

                dto.RoomLayouts = layouts;

                Status = true;
                return dto;
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                MessageObject.Message = "Lỗi hệ thống";
                MessageObject.MessageDetail = ex.Message;
                return null;
            }
        }

        /// <summary>
        /// Cập nhật thông tin cuộc họp
        /// </summary>
        public async Task UpdateMeeting(MeetingInfoDto request)
        {
            try
            {
                var meeting = await _dbContext.MeetingInfo
                    .FirstOrDefaultAsync(x => x.Id == request.Id);

                if (meeting == null)
                {
                    Status = false;
                    MessageObject.Message = "Lỗi hệ thống";
                    MessageObject.MessageDetail = "Không tìm thấy cuộc họp!";
                    return;
                }

                // Không cho phép sửa cuộc họp đã kết thúc
                if (meeting.Status == MeetingStatus.KetThuc)
                {
                    Status = false;
                    MessageObject.Message = "Không thể chỉnh sửa";
                    MessageObject.MessageDetail = "Không thể chỉnh sửa cuộc họp đã kết thúc!";
                    return;
                }

                var isOngoingMeeting = meeting.Status == MeetingStatus.DangHop;

                meeting.Name = request.Name;
                meeting.MeetContent = request.MeetContent;
                meeting.RoomId = request.RoomId;
                meeting.ExpectedStartTime = request.ExpectedStartTime;
                meeting.Notes = request.Notes;
                meeting.UpdateBy = _dbContext.GetUserRequest();
                meeting.UpdateDate = DateTime.Now;

                _dbContext.MeetingInfo.Update(meeting);

                var currentPersonal = await _dbContext.MeetingPersonal
                    .Where(x => x.MeetingId == request.Id)
                    .ToListAsync();

                if (isOngoingMeeting)
                {
                    var currentUserNames = currentPersonal.Select(p => p.UserName).ToList();

                    var newPersonal = request.Personal
                        .Where(p => !currentUserNames.Contains(p.UserName))
                        .ToList();
                    if (newPersonal.Any())
                    {
                        foreach (var p in newPersonal)
                        {
                            p.Id = Guid.NewGuid().ToString();
                            p.MeetingId = request.Id;
                            p.RefrenceFileId = Guid.NewGuid().ToString();
                            p.Type = PersonalType.UserHeThong;
                            p.Title = null;
                            p.CreateBy = _dbContext.GetUserRequest();
                            p.CreateDate = DateTime.Now;
                        }
                        await _dbContext.MeetingPersonal.AddRangeAsync(newPersonal);
                    }

                    foreach (var existingPerson in currentPersonal)
                    {
                        var updatedPerson = request.Personal
                            .FirstOrDefault(p => p.UserName == existingPerson.UserName);

                        if (updatedPerson != null)
                        {
                            existingPerson.IsParticipateInVoting = updatedPerson.IsParticipateInVoting;
                            existingPerson.UpdateBy = _dbContext.GetUserRequest();
                            existingPerson.UpdateDate = DateTime.Now;

                            _dbContext.MeetingPersonal.Update(existingPerson);
                        }
                    }
                }
                else
                {
                    _dbContext.MeetingPersonal.RemoveRange(currentPersonal);

                    foreach (var p in request.Personal)
                    {
                        p.Id = Guid.NewGuid().ToString();
                        p.MeetingId = request.Id;
                        p.RefrenceFileId = Guid.NewGuid().ToString();
                        p.Type = PersonalType.UserHeThong;
                        p.Title = null;
                        p.CreateBy = _dbContext.GetUserRequest();
                        p.CreateDate = DateTime.Now;
                    }
                    await _dbContext.MeetingPersonal.AddRangeAsync(request.Personal);
                }

                var currentFiles = await _dbContext.CmFile
                    .Where(x => x.RefrenceFileId == meeting.RefrenceFileId)
                    .ToListAsync();

                var requestFileIds = request.Files.Select(f => f.Id).ToList();
                var filesToRemove = currentFiles.Where(f => !requestFileIds.Contains(f.Id)).ToList();

                if (filesToRemove.Any())
                {
                    _dbContext.CmFile.RemoveRange(filesToRemove);
                }

                var currentFileIds = currentFiles.Select(f => f.Id).ToList();
                var newFiles = request.Files
                    .Where(f => !currentFileIds.Contains(f.Id))
                    .Select(f => _mapper.Map<CmFile>(f))
                    .ToList();

                foreach (var f in newFiles)
                {
                    f.RefrenceFileId = meeting.RefrenceFileId;
                    f.Type = FileType.TaiLieu;
                }

                if (newFiles.Any())
                {
                    await _dbContext.CmFile.AddRangeAsync(newFiles);
                }

                var currentVotes = await _dbContext.MeetingVote
                    .Where(x => x.MeetingId == request.Id)
                    .ToListAsync();

                var requestVoteIds = request.Votes
                    .Where(v => !string.IsNullOrEmpty(v.Id))
                    .Select(v => v.Id)
                    .ToList();

                var votesToRemove = currentVotes
                    .Where(v => !requestVoteIds.Contains(v.Id))
                    .ToList();

                foreach (var vote in votesToRemove)
                {
                    var voteFiles = await _dbContext.CmFile
                        .Where(x => x.RefrenceFileId == vote.RefrenceFileId)
                        .ToListAsync();
                    if (voteFiles.Any())
                    {
                        _dbContext.CmFile.RemoveRange(voteFiles);
                    }

                    var voteResults = await _dbContext.MeetingVoteResults
                        .Where(x => x.VoteId == vote.Id)
                        .ToListAsync();
                    if (voteResults.Any())
                    {
                        _dbContext.MeetingVoteResults.RemoveRange(voteResults);
                    }
                }

                if (votesToRemove.Any())
                {
                    _dbContext.MeetingVote.RemoveRange(votesToRemove);
                }

                foreach (var voteDto in request.Votes)
                {
                    if (string.IsNullOrEmpty(voteDto.Id))
                    {
                        var refrenceFileId = Guid.NewGuid().ToString();
                        voteDto.Id = Guid.NewGuid().ToString();
                        voteDto.Status = MeetingVoteStatus.ChuaBatDau;
                        voteDto.RefrenceFileId = refrenceFileId;
                        voteDto.MeetingId = request.Id;

                        var newVote = _mapper.Map<MeetingVote>(voteDto);
                        newVote.CreateBy = _dbContext.GetUserRequest();
                        newVote.CreateDate = DateTime.Now;

                        await _dbContext.MeetingVote.AddAsync(newVote);

                        if (voteDto.Files != null && voteDto.Files.Any())
                        {
                            foreach (var f in voteDto.Files)
                            {
                                f.RefrenceFileId = refrenceFileId;
                                f.Type = FileType.Khac;
                            }
                            var voteFiles = _mapper.Map<List<CmFile>>(voteDto.Files);
                            await _dbContext.CmFile.AddRangeAsync(voteFiles);
                        }
                    }
                    else
                    {
                        var existingVote = currentVotes.FirstOrDefault(v => v.Id == voteDto.Id);
                        if (existingVote != null)
                        {
                            existingVote.Name = voteDto.Name;
                            existingVote.Notes = voteDto.Notes;
                            existingVote.Time = voteDto.Time;
                            existingVote.UpdateBy = _dbContext.GetUserRequest();
                            existingVote.UpdateDate = DateTime.Now;

                            _dbContext.MeetingVote.Update(existingVote);

                            var currentVoteFiles = await _dbContext.CmFile
                                .Where(x => x.RefrenceFileId == existingVote.RefrenceFileId)
                                .ToListAsync();

                            var voteFileIds = voteDto.Files.Select(f => f.Id).ToList();
                            var voteFilesToRemove = currentVoteFiles
                                .Where(f => !voteFileIds.Contains(f.Id))
                                .ToList();

                            if (voteFilesToRemove.Any())
                            {
                                _dbContext.CmFile.RemoveRange(voteFilesToRemove);
                            }

                            var currentVoteFileIds = currentVoteFiles.Select(f => f.Id).ToList();
                            var newVoteFiles = voteDto.Files
                                .Where(f => !currentVoteFileIds.Contains(f.Id))
                                .ToList();

                            if (newVoteFiles.Any())
                            {
                                foreach (var f in newVoteFiles)
                                {
                                    f.RefrenceFileId = existingVote.RefrenceFileId;
                                    f.Type = FileType.Khac;
                                }
                                var voteFilesEntity = _mapper.Map<List<CmFile>>(newVoteFiles);
                                await _dbContext.CmFile.AddRangeAsync(voteFilesEntity);
                            }
                        }
                    }
                }
                var currentLayouts = await _dbContext.MeetingRoomLayout
                    .Where(x => x.MeetingId == request.Id)
                    .ToListAsync();

                if (currentLayouts.Any())
                {
                    _dbContext.MeetingRoomLayout.RemoveRange(currentLayouts);
                }

                if (request.RoomLayouts != null && request.RoomLayouts.Any())
                {
                    foreach (var layout in request.RoomLayouts)
                    {
                        layout.Id = Guid.NewGuid().ToString();  // ← Tạo ID mới
                        layout.MeetingId = request.Id;
                        layout.IsActive = true;
                        layout.CreateBy = _dbContext.GetUserRequest();
                        layout.CreateDate = DateTime.Now;
                    }
                    await _dbContext.MeetingRoomLayout.AddRangeAsync(request.RoomLayouts);
                }

                // ✅ Lưu tất cả thay đổi
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



        public async Task DeleteMeeting(string meetingId)
        {
            try
            {
                var meeting = await _dbContext.MeetingInfo
                    .FirstOrDefaultAsync(x => x.Id == meetingId);

                if (meeting == null)
                {
                    Status = false;
                    MessageObject.Message = "Lỗi hệ thống";
                    MessageObject.MessageDetail = "Không tìm thấy cuộc họp!";
                    return;
                }

                if (meeting.Status != MeetingStatus.ChuaBatDau)
                {
                    Status = false;
                    MessageObject.Message = "Không thể xóa";
                    MessageObject.MessageDetail = "Chỉ có thể xóa cuộc họp chưa bắt đầu!";
                    return;
                }

                var meetingRefrenceFileId = meeting.RefrenceFileId;

                var personalList = await _dbContext.MeetingPersonal
                    .Where(x => x.MeetingId == meetingId)
                    .ToListAsync();

                if (personalList.Any())
                {
                    _dbContext.MeetingPersonal.RemoveRange(personalList);
                }

                var voteList = await _dbContext.MeetingVote
                    .Where(x => x.MeetingId == meetingId)
                    .ToListAsync();

                if (voteList.Any())
                {
                    foreach (var vote in voteList)
                    {
                        var resultList = await _dbContext.MeetingVoteResults
                            .Where(x => x.VoteId == vote.Id)
                            .ToListAsync();

                        if (resultList.Any())
                        {
                            _dbContext.MeetingVoteResults.RemoveRange(resultList);
                        }

                        var voteFiles = await _dbContext.CmFile
                            .Where(x => x.RefrenceFileId == vote.RefrenceFileId)
                            .ToListAsync();

                        if (voteFiles.Any())
                        {
                            _dbContext.CmFile.RemoveRange(voteFiles);
                        }
                    }

                    _dbContext.MeetingVote.RemoveRange(voteList);
                }

                var messageList = await _dbContext.MeetingMessage
                    .Where(x => x.MeetingId == meetingId)
                    .ToListAsync();

                if (messageList.Any())
                {
                    _dbContext.MeetingMessage.RemoveRange(messageList);
                }

                var layoutList = await _dbContext.MeetingRoomLayout
                    .Where(x => x.MeetingId == meetingId)
                    .ToListAsync();

                if (layoutList.Any())
                {
                    _dbContext.MeetingRoomLayout.RemoveRange(layoutList);
                }

                if (!string.IsNullOrEmpty(meetingRefrenceFileId))
                {
                    var meetingFiles = await _dbContext.CmFile
                        .Where(x => x.RefrenceFileId == meetingRefrenceFileId)
                        .ToListAsync();

                    if (meetingFiles.Any())
                    {
                        _dbContext.CmFile.RemoveRange(meetingFiles);
                    }
                }

                _dbContext.MeetingInfo.Remove(meeting);

                await _dbContext.SaveChangesAsync();

                Status = true;
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                MessageObject.Message = "Lỗi hệ thống";
                MessageObject.MessageDetail = $"Lỗi khi xóa cuộc họp: {ex.Message}";
            }
        }

    }
}
