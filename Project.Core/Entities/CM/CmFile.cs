using AutoMapper;
using Microsoft.AspNetCore.Http;
using Project.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Project.Core.Entities.CM
{
    public class CmFile : BaseEntity
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public decimal? FileSize { get; set; }
        public string? MimeType { get; set; }
        public string? Extention { get; set; }
        public int? Type { get; set; }
        public string? Icon { get; set; }
        public string? RefrenceFileId { get; set; }
        public bool? IsBienBan { get; set; }
        public int? OrderNumber { get; set; }
        public string? VoiceToText { get; set; }
    }

    public class FileDto : BaseDto, IMapFrom, IDto
    {
        [Key]
        public string? Id { get; set; }
        public string? FileName { get; set; }
        public decimal? FileSize { get; set; }
        public string? MimeType { get; set; }
        public string? Extention { get; set; }
        public string? Icon { get; set; }
        public int? Type { get; set; }
        public string? RefrenceFileId { get; set; }
        public bool? IsBienBan { get; set; }
        public DateTime? CreateDate { get; set; }
        public int? OrderNumber { get; set; }
        public string? VoiceToText { get; set; }
        public void Mapping(Profile profile)
        {
            profile.CreateMap<CmFile, FileDto>().ReverseMap();
        }
    }

    public class UploadMeetingFilesRequest
    {
        public List<IFormFile>? Files { get; set; }
        public string? RefrenceFileId { get; set; }
        public string? MeetingId { get; set; }
        public int? Type { get; set; }
    }


    public class SaveExcalidrawRequest
    {
        public string? Id { get; set; }              
        public string? MeetingId { get; set; }
        public string? RefrenceFileId { get; set; }
        public string? Name { get; set; }
        public string? Data { get; set; }           
        public string? CreateBy { get; set; }
    }

    public class ExcalidrawDetailDto
    {
        public string? Id { get; set; }
        public string? RefrenceFileId { get; set; }
        public string? Name { get; set; }
        public string? Data { get; set; }
        public string? CreateBy { get; set; }
        public DateTime? CreateDate { get; set; }
        public string? UpdateBy { get; set; }
        public DateTime? UpdateDate { get; set; }
    }
}
