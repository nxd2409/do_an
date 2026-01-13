using AutoMapper;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;
using Project.Core;
using Project.Core.Entities.CM;
using Project.Core.Statics;
using Project.Service.Common;
using Project.Service.Dtos.CM;
using System.Net.WebSockets;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Project.Service.Services.CM
{
    public interface IFileService : IGenericService<CmFile, FileDto>
    {
        Task PutFileObject(string fileId, Stream stream, long contentLength, string userName = null, string documentId = null, string phieuId = null, string fileIdFound = null);
        Task UploadFilesRecord(JibriRequest request);
        Task<List<FileDto>> Upload(List<IFormFile> files);
        Task<List<FileDto>> UploadAndSaveInMeeting(UploadMeetingFilesRequest request);
        Task<(byte[], string, string)> Download(string fileId);
        Task<List<FileDto>?> GetByRefrence(string refrenceFileId);
        Task<FileDto?> MoveToSharedDocument(string fileId, string meetingId);
        Task<(Stream?, string?, long, long, long)> StreamVideoRangeFromMinio(string fileId, long start, long? end);
        Task ExportSummaryMeeting(string meetingId);
        Task<FileDto?> SaveExcalidraw(SaveExcalidrawRequest request);
        Task<List<FileDto>?> GetExcalidrawList(string meetingId);
        Task<ExcalidrawDetailDto?> GetExcalidrawDetail(string id);
        Task<bool> DeleteExcalidraw(string id);
    }

    public class FileService(AppDbContext dbContext, IMapper mapper, IMinioClient minioClient, IOptions<MinioConfigDto> minioOptions) : GenericService<CmFile, FileDto>(dbContext, mapper), IFileService
    {
        private readonly MinioConfigDto _minioSettings = minioOptions.Value;
        private readonly IMinioClient _minioClient = minioClient;

        public async Task<List<FileDto>?> GetByRefrence(string refrenceFileId)
        {
            try
            {
                var _files = await _dbContext.CmFile.Where(x => x.RefrenceFileId == refrenceFileId).ToListAsync();
                return _mapper.Map<List<FileDto>>(_files);
            }
            catch(Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
        public async Task UploadFilesRecord(JibriRequest request)
        {
            try
            {
                var meeting = await _dbContext.MeetingInfo.FirstOrDefaultAsync(x => x.Id == request.MeetingId);
                var bucketName = _minioSettings.BucketName;
                bool found = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucketName));
                if (!found)
                {
                    await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName));
                }
                var protocol = _minioSettings.UseSSL ? "https" : "http";
                var baseUrl = $"{protocol}://{_minioSettings.Endpoint}:{_minioSettings.Port}";

                foreach (var file in request.Files)
                {
                    if (file == null || file.Length == 0)
                    {
                        continue;
                    }
                    var fileId = Guid.NewGuid().ToString();
                    var ext = Path.GetExtension(file.FileName);
                    var contentType = file.ContentType;

                    using (var stream = file.OpenReadStream())
                    {
                        var putObjectArgs = new PutObjectArgs()
                            .WithBucket(bucketName)
                            .WithObject(fileId)
                            .WithStreamData(stream)
                            .WithObjectSize(stream.Length)
                            .WithContentType(contentType);
                        await _minioClient.PutObjectAsync(putObjectArgs);
                    }

                    var order = await _dbContext.CmFile.Where(x => x.RefrenceFileId == meeting.RefrenceFileId && x.Type == FileType.GhiAm)
                        .MaxAsync(x => (int?)x.OrderNumber) ?? 0;

                    var fileName = file.FileName.Contains(".mp3") ? $"Audio ghi âm cuộc họp - {meeting?.Name} ({order + 1})" :
                        file.FileName.Contains(".mp4") ? $"Video ghi hình cuộc họp - {meeting?.Name}" : file.FileName;

                    var isAudioFile = file.FileName.Contains(".mp3");
                    string voiceToText = null;

                    if (isAudioFile)
                    {
                        voiceToText = await GetVoiceToText(fileId);
                    }

                    await _dbContext.CmFile.AddAsync(new CmFile
                    {
                        Id = fileId,
                        FileName = fileName,
                        FileSize = file.Length,
                        MimeType = contentType,
                        Extention = ext,
                        Type = isAudioFile ? FileType.GhiAm : FileType.GhiHinh,
                        Icon = GetFileIcon(contentType, file.FileName),
                        CreateDate = DateTime.Now,
                        RefrenceFileId = meeting.RefrenceFileId,
                        IsBienBan = true,
                        OrderNumber = isAudioFile ? order + 1 : 0,
                        VoiceToText = voiceToText
                    });
                }
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
            }
        }
        private async Task<string> GetVoiceToText(string objectName)
        {
            try
            {
                using (var httpClient = new HttpClient())
                {
                    var apiUrl = "http://124.158.6.81:9000/v1/audio/transcriptions/object";
                    var jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFwaV9tZW50b3IiLCJwcml2YXRlX3Rva2VuIjoidG9rZW5fYXBpX21lbnRvciIsImV4cGlyeV90aW1lIjoxNzk1MTcyMzExLCJyb2xlIjoiV09SS0VSIiwidXNlcl9zb3VyY2UiOiJhcGlfaW50ZWdyYXRpb24iLCJ0b2tlbl90eXBlIjoiYXBpX21lbnRvckBXT1JLRVJAYXBpIiwic2FsdCI6InNhbHRfYXBpX21lbnRvciJ9.yUMcphNmkvbVTGiUXwufY45fwfM2yH33CadvKcQLJMQ";

                    httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
                    httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {jwtToken}");

                    var requestBody = new
                    {
                        object_name = objectName
                    };

                    var content = new StringContent(
                        JsonSerializer.Serialize(requestBody),
                        Encoding.UTF8,
                        "application/json"
                    );

                    var response = await httpClient.PostAsync(apiUrl, content);

                    if (response.IsSuccessStatusCode)
                    {
                        var responseContent = await response.Content.ReadAsStringAsync();
                        var result = JsonSerializer.Deserialize<TranscriptionResponse>(responseContent);
                        return result?.text;
                    }

                    return null;
                }
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        private class TranscriptionResponse
        {
            public string text { get; set; }
            public double processing_time_seconds { get; set; }
            public string object_name { get; set; }
        }
        public async Task PutFileObject(string fileId, Stream stream, long contentLength, string userName = null, string documentId = null, string phieuId = null, string fileIdFound = null)
        {
            try
            {
                var bucketName = _minioSettings.BucketName;

                if (!await _minioClient.BucketExistsAsync(
                        new BucketExistsArgs().WithBucket(bucketName)))
                {
                    await _minioClient.MakeBucketAsync(
                        new MakeBucketArgs().WithBucket(bucketName));
                }

                var putArgs = new PutObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(fileId)
                    .WithStreamData(stream)
                    .WithObjectSize(contentLength)
                    .WithContentType("application/octet-stream");

                await _minioClient.PutObjectAsync(putArgs);

                var fileDb = await _dbContext.CmFile.FirstOrDefaultAsync(x => x.Id == fileId);
                if (fileDb != null)
                {
                    fileDb.FileSize = contentLength;
                    fileDb.UpdateDate = DateTime.Now;
                    fileDb.UpdateBy = userName;
                    await _dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
            }
        }
        public async Task<(Stream?, string?, long, long, long)> StreamVideoRangeFromMinio(string fileId, long start, long? end)
        {
            try
            {
                var bucket = _minioSettings.BucketName;
                var objectName = fileId;

                // Lấy metadata
                var stat = await _minioClient.StatObjectAsync(
                    new StatObjectArgs()
                        .WithBucket(bucket)
                        .WithObject(objectName));

                long fileSize = stat.Size;
                string contentType = stat.ContentType ?? "video/mp4";

                // Tính range hợp lệ
                long from = start;
                long to = end ?? Math.Min(from + 10 * 1024 * 1024 - 1, fileSize - 1); // 10MB mỗi chunk
                if (to >= fileSize) to = fileSize - 1;

                // Tạo presigned URL tạm (10 phút)
                var presignedUrl = await _minioClient.PresignedGetObjectAsync(
                    new PresignedGetObjectArgs()
                        .WithBucket(bucket)
                        .WithObject(objectName)
                        .WithExpiry(10 * 60) // 10 phút
                );

                // Gửi Range Request tới MinIO
                var httpClient = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Get, presignedUrl);
                request.Headers.TryAddWithoutValidation("Range", $"bytes={from}-{to}");

                var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

                if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.PartialContent)
                {
                    Status = false;
                    Exception = new Exception($"MinIO trả về mã lỗi: {response.StatusCode}");
                    return (null, null, 0, 0, 0);
                }

                var stream = await response.Content.ReadAsStreamAsync();

                return (stream, contentType, fileSize, from, to);
            }
            catch (ObjectNotFoundException)
            {
                Status = false;
                Exception = new ArgumentException("Video không tồn tại trên MinIO");
                return (null, null, 0, 0, 0);
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return (null, null, 0, 0, 0);
            }
        }
        public async Task<List<FileDto>> Upload(List<IFormFile> files)
        {
            try
            {

                var bucketName = _minioSettings.BucketName;
                bool found = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucketName));

                if (!found)
                {
                    await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName));
                }

                var responseList = new List<FileDto>();

                var protocol = _minioSettings.UseSSL ? "https" : "http";

                var baseUrl = $"{protocol}://{_minioSettings.Endpoint}:{_minioSettings.Port}";

                foreach (var file in files)
                {
                    if (file == null || file.Length == 0)
                    {
                        continue;
                    }
                    var fileId = Guid.NewGuid().ToString();

                    var ext = Path.GetExtension(file.FileName);

                    var contentType = file.ContentType;

                    using (var stream = file.OpenReadStream())
                    {
                        var putObjectArgs = new PutObjectArgs()
                            .WithBucket(bucketName)
                            .WithObject(fileId)
                            .WithStreamData(stream)
                            .WithObjectSize(stream.Length)
                            .WithContentType(contentType);

                        await _minioClient.PutObjectAsync(putObjectArgs);
                    }

                    responseList.Add(new FileDto
                    {
                        Id = fileId,
                        FileName = file.FileName,
                        FileSize = file.Length,
                        MimeType = contentType,
                        Extention = ext,
                        Icon = GetFileIcon(contentType, file.FileName),
                        CreateDate = DateTime.Now,
                    });
                }

                return responseList;
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return new List<FileDto>();
            }
        }
        public async Task<List<FileDto>> UploadAndSaveInMeeting(UploadMeetingFilesRequest request)
        {
            try
            {

                var bucketName = _minioSettings.BucketName;
                bool found = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucketName));

                if (!found)
                {
                    await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName));
                }

                var responseList = new List<FileDto>();

                var protocol = _minioSettings.UseSSL ? "https" : "http";

                var baseUrl = $"{protocol}://{_minioSettings.Endpoint}:{_minioSettings.Port}";

                foreach (var file in request.Files)
                {
                    if (file == null || file.Length == 0)
                    {
                        continue;
                    }
                    var fileId = Guid.NewGuid().ToString();

                    var ext = Path.GetExtension(file.FileName);

                    var contentType = file.ContentType;

                    using (var stream = file.OpenReadStream())
                    {
                        var putObjectArgs = new PutObjectArgs()
                            .WithBucket(bucketName)
                            .WithObject(fileId)
                            .WithStreamData(stream)
                            .WithObjectSize(stream.Length)
                            .WithContentType(contentType);

                        await _minioClient.PutObjectAsync(putObjectArgs);
                    }

                    var _file = new FileDto
                    {
                        Id = fileId,
                        FileName = file.FileName,
                        FileSize = file.Length,
                        MimeType = contentType,
                        Extention = ext,
                        RefrenceFileId = request.RefrenceFileId,
                        Icon = GetFileIcon(contentType, file.FileName),
                        CreateDate = DateTime.Now,
                        Type = request.Type
                    };
                    responseList.Add(_file);
                    await _dbContext.CmFile.AddAsync(_mapper.Map<CmFile>(_file));
                }
                await _dbContext.SaveChangesAsync();
                return responseList;
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return new List<FileDto>();
            }
        }
        public async Task<(byte[], string, string)> Download(string fileId)
        {
            try
            {
                var bucketName = _minioSettings.BucketName;
                var objectName = fileId;

                var statObjectArgs = new StatObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(objectName);
                var stat = await _minioClient.StatObjectAsync(statObjectArgs);

                var memoryStream = new MemoryStream();
                var getObjectArgs = new GetObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(objectName)
                    .WithCallbackStream(stream => stream.CopyTo(memoryStream));

                await _minioClient.GetObjectAsync(getObjectArgs);

                memoryStream.Position = 0;

                var fileDb = _dbContext.CmFile.FirstOrDefault(x => x.Id == fileId);

                return (memoryStream.ToArray(), fileDb == null ? stat.ObjectName : fileDb.FileName, stat.ContentType);
            }
            catch (ObjectNotFoundException)
            {
                Status = false;
                Exception = new ArgumentException("File không tồn tại trên MinIO");
                return (null, null, null);
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return (null, null, null);
            }
        }
        public async Task<FileDto?> MoveToSharedDocument(string fileId, string meetingId)
        {
            try
            {
                var meeting = await _dbContext.MeetingInfo.FirstOrDefaultAsync(x => x.Id == meetingId);
                var fileCurrent = await _dbContext.CmFile.FirstOrDefaultAsync(x => x.Id == fileId);

                var bucketName = _minioSettings.BucketName;
                var protocol = _minioSettings.UseSSL ? "https" : "http";
                var baseUrl = $"{protocol}://{_minioSettings.Endpoint}:{_minioSettings.Port}";

                bool found = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucketName));
                if (!found)
                {
                    throw new Exception($"Bucket '{bucketName}' không tồn tại.");
                }

                var objectName = fileId;

                try
                {
                    var stat = await _minioClient.StatObjectAsync(new StatObjectArgs()
                        .WithBucket(bucketName)
                        .WithObject(objectName));

                    var newFileId = Guid.NewGuid().ToString("N");
                    var ext = Path.GetExtension(stat.ObjectName);
                    var newObjectName = $"{newFileId}{ext}";

                    var copySource = new CopySourceObjectArgs()
                        .WithBucket(bucketName)
                        .WithObject(objectName);

                    var copyArgs = new CopyObjectArgs()
                        .WithBucket(bucketName)
                        .WithObject(newObjectName)
                        .WithCopyObjectSource(copySource);

                    await _minioClient.CopyObjectAsync(copyArgs);

                    var newFileDto = new FileDto
                    {
                        Id = newFileId,
                        FileName = fileCurrent?.FileName, 
                        FileSize = stat.Size,
                        MimeType = stat.ContentType,
                        Extention = ext,
                        Type = FileType.TaiLieu,
                        Icon = GetFileIcon(stat.ContentType, stat.ObjectName),
                        CreateDate = DateTime.UtcNow,
                        RefrenceFileId = meeting?.RefrenceFileId,

                    };

                    await _dbContext.CmFile.AddAsync(_mapper.Map<CmFile>(newFileDto));
                    await _dbContext.SaveChangesAsync();

                    return newFileDto;
                }
                catch (ObjectNotFoundException)
                {
                    return null;
                }
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
        public async Task<FileDto?> SaveExcalidraw(SaveExcalidrawRequest request)
        {
            try
            {
                var bucketName = _minioSettings.BucketName;
                bool found = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucketName));
                if (!found)
                {
                    await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName));
                }

                string fileId;
                CmFile? existingFile = null;

                if (!string.IsNullOrWhiteSpace(request.Id))
                {
                    existingFile = await _dbContext.CmFile
                        .FirstOrDefaultAsync(x => x.Id == request.Id && x.Type == FileType.BangTrang);

                    if (existingFile == null)
                    {
                        Status = false;
                        Exception = new Exception("Không tìm thấy bảng trắng");
                        return null;
                    }
                    fileId = existingFile.Id;
                }
                else
                {
                    fileId = Guid.NewGuid().ToString();
                }

                var jsonData = request.Data ?? "";
                var bytes = System.Text.Encoding.UTF8.GetBytes(jsonData);
                var contentType = "application/vnd.excalidraw+json";

                using (var stream = new MemoryStream(bytes))
                {
                    var putObjectArgs = new PutObjectArgs()
                        .WithBucket(bucketName)
                        .WithObject(fileId)
                        .WithStreamData(stream)
                        .WithObjectSize(stream.Length)
                        .WithContentType(contentType);

                    await _minioClient.PutObjectAsync(putObjectArgs);
                }

                if (existingFile != null)
                {
                    existingFile.FileName = request.Name;
                    existingFile.FileSize = bytes.Length;
                    existingFile.UpdateDate = DateTime.Now;
                    existingFile.UpdateBy = request.CreateBy;

                    _dbContext.CmFile.Update(existingFile);
                }
                else
                {
                    var newFile = new CmFile
                    {
                        Id = fileId,
                        FileName = request.Name,
                        FileSize = bytes.Length,
                        MimeType = contentType,
                        Extention = ".excalidraw",
                        RefrenceFileId = request.RefrenceFileId,
                        Type = FileType.BangTrang,
                        Icon = "img/draw.jpg",
                        IsBienBan = false,
                        IsActive = true,
                        CreateDate = DateTime.Now,
                        CreateBy = request.CreateBy
                    };

                    await _dbContext.CmFile.AddAsync(newFile);
                }

                await _dbContext.SaveChangesAsync();

                return _mapper.Map<FileDto>(existingFile ?? await _dbContext.CmFile.FindAsync(fileId));
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
        public async Task<List<FileDto>?> GetExcalidrawList(string RefrenceFileId)
        {
            try
            {
                var list = await _dbContext.CmFile
                    .Where(x => x.RefrenceFileId == RefrenceFileId
                             && x.Type == FileType.BangTrang
                             && x.IsActive == true)
                    .OrderByDescending(x => x.CreateDate)
                    .ToListAsync();

                return _mapper.Map<List<FileDto>>(list);
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
        public async Task<ExcalidrawDetailDto?> GetExcalidrawDetail(string id)
        {
            try
            {
                var file = await _dbContext.CmFile
                    .FirstOrDefaultAsync(x => x.Id == id && x.Type == FileType.BangTrang && x.IsActive == true);

                if (file == null)
                {
                    Status = false;
                    Exception = new Exception("Không tìm thấy bảng trắng");
                    return null;
                }

                var bucketName = _minioSettings.BucketName;
                string? jsonData = null;

                var getObjectArgs = new GetObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(file.Id)
                    .WithCallbackStream((stream) =>
                    {
                        using (var memoryStream = new MemoryStream())
                        {
                            stream.CopyTo(memoryStream);
                            jsonData = System.Text.Encoding.UTF8.GetString(memoryStream.ToArray());
                        }
                    });

                await _minioClient.GetObjectAsync(getObjectArgs);

                return new ExcalidrawDetailDto
                {
                    Id = file.Id,
                    Name = file.FileName ?? "",
                    Data = jsonData,
                    CreateBy = file.CreateBy,
                    CreateDate = file.CreateDate,
                    UpdateBy = file.UpdateBy,
                    UpdateDate = file.UpdateDate
                };
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return null;
            }
        }
        public async Task<bool> DeleteExcalidraw(string id)
        {
            try
            {
                var file = await _dbContext.CmFile
                    .FirstOrDefaultAsync(x => x.Id == id && x.Type == FileType.BangTrang);

                if (file == null)
                {
                    Status = false;
                    Exception = new Exception("Không tìm thấy bảng trắng");
                    return false;
                }

                file.IsActive = false;
                file.UpdateDate = DateTime.Now;

                _dbContext.CmFile.Update(file);
                await _dbContext.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                Status = false;
                Exception = ex;
                return false;
            }
        }
        public string GetFileIcon(string fileType, string fileName)
        {
            fileType = (fileType ?? "").ToLower();

            if (fileType == "application/pdf")
                return "img/pdf.png";

            if (fileType == "application/msword" || fileType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                return "img/word.png";

            if (fileType == "application/vnd.ms-excel" || fileType == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                return "img/excel.png";

            if (fileType == "application/vnd.ms-powerpoint" || fileType == "application/vnd.openxmlformats-officedocument.presentationml.presentation")
                return "img/powerpoint.png";

            if (fileType.StartsWith("video/") || fileType.Contains("mp4") || fileName.Contains(".mp4"))
                return "img/multimedia.png";

            if (fileType.StartsWith("audio/") || fileType.Contains("mp3") || fileName.Contains(".mp3"))
                return "img/audio.png";

            if (fileType.StartsWith("image/"))
                return "img/image.png";

            return "img/file.png";
        }
        public async Task ExportSummaryMeeting(string meetingId)
        {
            try
            {
                var meeting = await _dbContext.MeetingInfo.FirstOrDefaultAsync(x => x.Id == meetingId);

                var audioFiles = await _dbContext.CmFile
                    .Where(x => x.RefrenceFileId == meeting.RefrenceFileId && x.Type == FileType.GhiAm)
                    .OrderBy(x => x.OrderNumber)
                    .ToListAsync();

                var participants = await _dbContext.MeetingPersonal
                    .Where(x => x.MeetingId == meetingId)
                    .ToListAsync();

                var votes = await _dbContext.MeetingVote
                    .Where(x => x.MeetingId == meetingId)
                    .ToListAsync();

                var voteIds = votes.Select(x => x.Id).ToList();
                var voteResults = await _dbContext.MeetingVoteResults
                    .Where(x => voteIds.Contains(x.VoteId))
                    .ToListAsync();

                var transcripts = new List<dynamic>();
                int chunkId = 0;

                foreach (var audioFile in audioFiles)
                {
                    if (!string.IsNullOrEmpty(audioFile.VoiceToText))
                    {
                        transcripts.Add(new
                        {
                            chunk_id = chunkId++,
                            text = audioFile.VoiceToText,
                            timestamp = audioFile.CreateDate
                        });
                    }
                }

                var participantsText = "\n--- THÀNH PHẦN THAM DỰ ---\n";
                foreach (var p in participants)
                {
                    var role = p.IsChuTri == true ? "Chủ trì" :
                               p.IsThuKy == true ? "Thư ký" : "Thành viên";
                    participantsText += $"- {p.FullName} ({role})\n";
                }

                transcripts.Add(new
                {
                    chunk_id = chunkId++,
                    text = participantsText.TrimEnd('\n'),
                    timestamp = DateTime.Now
                });

                transcripts.Add(new
                {
                    chunk_id = chunkId++,
                    text = $"Thời gian bắt đầu : {meeting.StartDate} - Thời gian kết thúc : {meeting.EndDate}",
                    timestamp = DateTime.Now
                });

                foreach (var vote in votes)
                {
                    var voteText = $"\n--- BIỂU QUYẾT ---\n";
                    voteText += $"Tên: {vote.Name}\n";
                    voteText += $"Ghi chú: {vote.Notes}\n";
                    voteText += $"Thời gian: {vote.Time}\n";
                    voteText += $"Trạng thái: {vote.Status}\n\n";

                    voteText += "KẾT QUẢ BIỂU QUYẾT:\n";

                    var voteResultsForVote = voteResults.Where(r => r.VoteId == vote.Id).ToList();

                    foreach (var r in voteResultsForVote)
                    {
                        var voteResult = r.Answer == 1 ? "Tán thành" :
                                        r.Answer == 0 ? "Không tán thành" :
                                        "Không ý kiến";
                        voteText += $"- {r.Username}: {voteResult}\n";
                    }

                    voteText += $"\nTỔNG KẾT:\n";
                    voteText += $"Tổng số: {voteResultsForVote.Count}\n";
                    voteText += $"Tán thành: {voteResultsForVote.Count(r => r.Answer == 1)}\n";
                    voteText += $"Không tán thành: {voteResultsForVote.Count(r => r.Answer == 0)}\n";
                    voteText += $"Không ý kiến: {voteResultsForVote.Count(r => r.Answer == 2)}";

                    transcripts.Add(new
                    {
                        chunk_id = chunkId++,
                        text = voteText,
                        timestamp = DateTime.Now
                    });
                }

                using (var httpClient = new HttpClient())
                {
                    var apiUrl = "http://124.158.6.81:9000/v1/meetings/export/docx";
                    var jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFwaV9tZW50b3IiLCJwcml2YXRlX3Rva2VuIjoidG9rZW5fYXBpX21lbnRvciIsImV4cGlyeV90aW1lIjoxNzk1MTcyMzExLCJyb2xlIjoiV09SS0VSIiwidXNlcl9zb3VyY2UiOiJhcGlfaW50ZWdyYXRpb24iLCJ0b2tlbl90eXBlIjoiYXBpX21lbnRvckBXT1JLRVJAYXBpIiwic2FsdCI6InNhbHRfYXBpX21lbnRvciJ9.yUMcphNmkvbVTGiUXwufY45fwfM2yH33CadvKcQLJMQ";

                    httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
                    httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {jwtToken}");
                    httpClient.Timeout = TimeSpan.FromMinutes(5);

                    var requestBody = new
                    {
                        meeting_id = meetingId,
                        title = meeting.Name,
                        transcripts = transcripts
                    };

                    var options = new JsonSerializerOptions
                    {
                        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                        WriteIndented = true
                    };

                    var content = new StringContent(
                        JsonSerializer.Serialize(requestBody, options),
                        Encoding.UTF8,
                        "application/json"
                    );

                    var response = await httpClient.PostAsync(apiUrl, content);

                    if (!response.IsSuccessStatusCode)
                    {
                        throw new Exception("Không thể export file docx");
                    }

                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

                    if (result.GetProperty("status").GetString() != "success")
                    {
                        throw new Exception("API export trả về lỗi");
                    }

                    var downloadUrl = result.GetProperty("download_url").GetString();

                    // Tạo HttpClient mới không có headers để download
                    byte[] fileBytes;
                    using (var downloadClient = new HttpClient())
                    {
                        downloadClient.Timeout = TimeSpan.FromMinutes(5);
                        var fileResponse = await downloadClient.GetAsync(downloadUrl);

                        if (!fileResponse.IsSuccessStatusCode)
                        {
                            throw new Exception($"Không thể download file docx: {fileResponse.StatusCode}");
                        }

                        fileBytes = await fileResponse.Content.ReadAsByteArrayAsync();
                    }

                    var bucketName = _minioSettings.BucketName;
                    bool found = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucketName));
                    if (!found)
                    {
                        await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName));
                    }

                    var fileId = Guid.NewGuid().ToString();
                    var fileName = $"Biên bản cuộc họp - {meeting.Name}.docx";
                    var contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

                    using (var stream = new MemoryStream(fileBytes))
                    {
                        var putObjectArgs = new PutObjectArgs()
                            .WithBucket(bucketName)
                            .WithObject(fileId)
                            .WithStreamData(stream)
                            .WithObjectSize(stream.Length)
                            .WithContentType(contentType);

                        await _minioClient.PutObjectAsync(putObjectArgs);
                    }

                    var cmFile = new CmFile
                    {
                        Id = fileId,
                        FileName = fileName,
                        FileSize = fileBytes.Length,
                        MimeType = contentType,
                        Extention = ".docx",
                        Type = FileType.BienBan,
                        Icon = GetFileIcon(contentType, fileName),
                        CreateDate = DateTime.Now,
                        RefrenceFileId = meeting.RefrenceFileId,
                        IsBienBan = true,
                        OrderNumber = 0
                    };

                    await _dbContext.CmFile.AddAsync(cmFile);
                    await _dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                this.Status = false;
                this.Exception = ex;
            }
        }
    }
}
