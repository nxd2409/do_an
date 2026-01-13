using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Minio.DataModel.Select;
using Project.Api.Hubs;
using Project.Core.Entities.CM;
using Project.Core.Statics;
using Project.Service.Common;
using Project.Service.Dtos.CM;
using Project.Service.Services.CM;

namespace Project.Api.Controllers.CM
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController(IFileService service, IHubContext<NotificationHub> signalR) : ControllerBase
    {
        public readonly IFileService _service = service;
        private readonly IHubContext<NotificationHub> _signalR = signalR;

        [AllowAnonymous]
        [HttpPost("CallbackWithoutError")]
        public IActionResult CallbackWithoutError([FromBody] OnlyOfficeCallbackDto model)
        {
            return Ok(new { error = 0 });
        }

        [HttpPost("Upload")]
        [RequestSizeLimit(4_294_967_296)]
        [RequestFormLimits(MultipartBodyLengthLimit = 4_294_967_296)]
        public async Task<IActionResult> Upload(List<IFormFile> files)
        {
            var res = new TransferObject();
            if (files == null || files.Count == 0)
            {
                res.Status = false;
                res.MessageObject.Message = "Không có file được chọn";
                return Ok(res);
            }

            var result = await _service.Upload(files);
            if (_service.Status)
            {
                res.Data = result;
                res.Status = true;
                await res.GetMessage("0107", _service);
            }
            else
            {
                res.Status = false;
                await res.GetMessage("0108", _service);
            }

            return Ok(res);
        }

        [HttpPost("UploadAndSaveInMeeting")]
        public async Task<IActionResult> UploadAndSaveInMeeting([FromForm] UploadMeetingFilesRequest request)
        {
            var res = new TransferObject();
            if (request.Files == null || request.Files.Count == 0)
            {
                res.Status = false;
                res.MessageObject.Message = "Không có file được chọn";
                return Ok(res);
            }

            var result = await _service.UploadAndSaveInMeeting(request);

            if (_service.Status)
            {
                res.Data = result;
                res.Status = true;
                await res.GetMessage("0107", _service);
            }
            else
            {
                res.Status = false;
                await res.GetMessage("0108", _service);
            }

            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                username = "SMR",
                action = SignalRAction.UploadFile,
                message = $"Văn bản, tài liệu chung mới được cập nhật!"
            });

            return Ok(res);
        }

        [HttpGet("GetByRefrence/{refrenceFileId}")]
        public async Task<IActionResult> GetByRefrence([FromRoute] string refrenceFileId)
        {
            var res = new TransferObject();
            var data = await _service.GetByRefrence(refrenceFileId);
            if (_service.Status)
            {
                res.Data = data;
            }
            else
            {
                await res.GetMessage("0001", _service);
            }
            return Ok(res);
        }

        [HttpGet("Download/{fileId}")]
        public async Task<IActionResult> Download(string fileId)
        {
            var (fileData, fileName, contentType) = await _service.Download(fileId);
            if (_service.Status && fileData != null)
            {
                // Set Content-Disposition header với encoding đúng
                Response.Headers.Add("Content-Disposition",
                    $"attachment; filename*={Uri.EscapeDataString(fileName)}");

                return File(fileData, contentType ?? "application/octet-stream");
            }
            else
            {
                return NotFound(new TransferObject
                {
                    Status = false,
                    MessageObject = new MessageObject
                    {
                        Message = "File không tồn tại trên MinIO!"
                    }
                });
            }
        }

        [HttpGet("StreamVideo/{fileId}")]
        public async Task<IActionResult> StreamVideo(string fileId)
        {
            try
            {
                // Lấy Range header (nếu có)
                var rangeHeader = Request.Headers["Range"].ToString();
                var range = ParseRange(rangeHeader);

                // Gọi service để stream từ MinIO
                var (stream, contentType, fileSize, from, to) = await _service.StreamVideoRangeFromMinio(fileId, range.start, range.end);

                if (!_service.Status || stream == null)
                {
                    return NotFound(new { Status = false, Message = "Không thể stream video!" });
                }

                Response.StatusCode = StatusCodes.Status206PartialContent;
                Response.Headers["Accept-Ranges"] = "bytes";
                Response.Headers["Content-Range"] = $"bytes {from}-{to}/{fileSize}";
                Response.Headers["Content-Length"] = (to - from + 1).ToString();
                Response.ContentType = "video/mp4";

                return new FileStreamResult(stream, "video/mp4");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi khi stream video", Error = ex.Message });
            }
        }

        private (long start, long? end) ParseRange(string rangeHeader)
        {
            if (string.IsNullOrEmpty(rangeHeader) || !rangeHeader.StartsWith("bytes="))
                return (0, null);

            var parts = rangeHeader.Replace("bytes=", "").Split('-');
            long start = long.TryParse(parts[0], out var s) ? s : 0;
            long? end = parts.Length > 1 && long.TryParse(parts[1], out var e) ? e : null;

            return (start, end);
        }


        [HttpGet("MoveToSharedDocument")]
        public async Task<IActionResult> MoveToSharedDocument([FromQuery] string meetingId, [FromQuery] string fileId)
        {
            var res = new TransferObject();
            var data = await _service.MoveToSharedDocument(fileId, meetingId);
            if (_service.Status)
            {
                res.Data = data;
            }
            else
            {
                await res.GetMessage("0001", _service);
            }
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = meetingId,
                username = "SMR",
                action = SignalRAction.UploadFile,
                message = $"Văn bản, tài liệu chung mới được cập nhật!"
            });
            return Ok(res);
        }

        [HttpPost("UploadFilesRecord")]
        [RequestSizeLimit(4_294_967_296)]
        [RequestFormLimits(MultipartBodyLengthLimit = 4_294_967_296)]
        public async Task<IActionResult> UploadFilesRecord([FromForm] JibriRequest request)
        {
            try
            {
                var transferObject = new TransferObject();
                if (request.Files == null)
                {
                    return BadRequest(new { message = "No file provided" });
                }

                await _service.UploadFilesRecord(request);

                if (!_service.Status)
                {
                    return BadRequest(new { message = "Upload failed", error = _service.Exception?.Message });
                }

                await _signalR.Clients.All.SendAsync("ReceiveNotification", new
                {
                    meetingId = request.MeetingId,
                    username = "SMR",
                    action = SignalRAction.UploadFile,
                    message = $"Văn bản, tài liệu chung mới được cập nhật!"
                });

                return Ok(transferObject);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("ExportSummaryMeeting/{meetingId}")]
        public async Task<IActionResult> ExportSummaryMeeting([FromRoute] string meetingId)
        {
            await _service.ExportSummaryMeeting(meetingId);

            return Ok(new TransferObject());
        }

        [HttpPost("SaveExcalidraw")]
        public async Task<IActionResult> SaveExcalidraw([FromBody] SaveExcalidrawRequest request)
        {
            var res = new TransferObject();

            if (string.IsNullOrWhiteSpace(request.MeetingId))
            {
                res.Status = false;
                res.MessageObject.Message = "MeetingId không được để trống";
                return Ok(res);
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                res.Status = false;
                res.MessageObject.Message = "Tên bảng trắng không được để trống";
                return Ok(res);
            }

            var result = await _service.SaveExcalidraw(request);

            if (_service.Status)
            {
                res.Data = result;
                res.Status = true;
                await res.GetMessage("0112", _service);

                await _signalR.Clients.All.SendAsync("ReceiveNotification", new
                {
                    meetingId = request.MeetingId,
                    action = SignalRAction.UpdateExcalidraw,
                    message = $"Bảng trắng '{request.Name}' đã được cập nhật!"
                });
            }
            else
            {
                res.Status = false;
                await res.GetMessage("0108", _service);
            }

            return Ok(res);
        }

        [HttpGet("GetExcalidrawList/{meetingId}")]
        public async Task<IActionResult> GetExcalidrawList(string meetingId)
        {
            var res = new TransferObject();

            if (string.IsNullOrWhiteSpace(meetingId))
            {
                res.Status = false;
                res.MessageObject.Message = "MeetingId không được để trống";
                return Ok(res);
            }

            var result = await _service.GetExcalidrawList(meetingId);

            if (_service.Status)
            {
                res.Data = result;
                res.Status = true;
            }
            else
            {
                res.Status = false;
                res.MessageObject.Message = "Không thể tải danh sách";
            }

            return Ok(res);
        }

        [HttpGet("GetExcalidrawDetail/{id}")]
        public async Task<IActionResult> GetExcalidrawDetail(string id)
        {
            var res = new TransferObject();

            if (string.IsNullOrWhiteSpace(id))
            {
                res.Status = false;
                res.MessageObject.Message = "Id không được để trống";
                return Ok(res);
            }

            var result = await _service.GetExcalidrawDetail(id);

            if (_service.Status)
            {
                res.Data = result;
                res.Status = true;
            }
            else
            {
                res.Status = false;
                res.MessageObject.Message = "Không thể tải bảng trắng";
            }

            return Ok(res);
        }

        [HttpDelete("DeleteExcalidraw/{id}")]
        public async Task<IActionResult> DeleteExcalidraw(string id)
        {
            var res = new TransferObject();

            if (string.IsNullOrWhiteSpace(id))
            {
                res.Status = false;
                res.MessageObject.Message = "Id không được để trống";
                return Ok(res);
            }

            var result = await _service.DeleteExcalidraw(id);

            if (_service.Status)
            {
                res.Status = true;
                await res.GetMessage("0111", _service);

                await _signalR.Clients.All.SendAsync("ReceiveNotification", new
                {
                    meetingId = "",
                    username = "System",
                    action = SignalRAction.DeleteExcalidraw,
                    message = "Bảng trắng đã được xóa!"
                });
            }
            else
            {
                res.Status = false;
                await res.GetMessage("0110", _service);
            }

            return Ok(res);
        }
    }

}
