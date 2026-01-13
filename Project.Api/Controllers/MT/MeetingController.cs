using Azure.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Project.Api.Hubs;
using Project.Core.Entities.CM;
using Project.Core.Entities.MD;
using Project.Core.Entities.MT;
using Project.Core.Statics;
using Project.Service.Common;
using Project.Service.Dtos.CM;
using Project.Service.Dtos.MT;
using Project.Service.Services.MT;
using System.Security.Claims;

namespace Project.Api.Controllers.MT
{
    [Route("api/[controller]")]
    [ApiController]
    public class MeetingController(IMeetingInfoService service, IHubContext<NotificationHub> signalR) : ControllerBase
    {
        public readonly IMeetingInfoService _service = service;
        private readonly IHubContext<NotificationHub> _signalR = signalR;

        [HttpGet("SearchMeetingInfo")]
        public async Task<IActionResult> SearchMeetingInfo([FromQuery] MeetingInfoDto request)
        {
            var res = new TransferObject();
            var data = await _service.SearchMeetingInfo(request);
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

        [HttpGet("BuildTreeOrgAndUser")]
        public async Task<IActionResult> BuildTreeOrgAndUser()
        {
            var res = new TransferObject();
            var data = await _service.BuildTreeOrgAndUser();
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

        [HttpGet("GetPersonalMeeting/{meetingId}")]
        public async Task<IActionResult> GetPersonalMeeting([FromRoute] string meetingId)
        {
            var res = new TransferObject();
            var data = await _service.GetPersonalMeeting(meetingId);
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

        [HttpGet("GetDetailVote/{voteId}")]
        public async Task<IActionResult> GetDetailVote([FromRoute] string voteId)
        {
            var res = new TransferObject();
            var data = await _service.GetDetailVote(voteId);
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

        [HttpGet("GetMeetingVote/{meetingId}")]
        public async Task<IActionResult> GetMeetingVote([FromRoute] string meetingId)
        {
            var res = new TransferObject();
            var data = await _service.GetMeetingVote(meetingId);
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

        [HttpGet("GetListFilesCommon/{meetingId}")]
        public async Task<IActionResult> GetListFilesCommon([FromRoute] string meetingId)
        {
            var res = new TransferObject();
            var data = await _service.GetListFilesCommon(meetingId);
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

        /// <summary>
        /// Lấy layout phòng họp đã lưu
        /// </summary>
        [HttpGet("{meetingId}/layout")]
        public async Task<IActionResult> GetMeetingLayout([FromRoute] string meetingId)
        {
            var res = new TransferObject();
            var data = await _service.GetMeetingLayout(meetingId);
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

        [HttpGet("StartQuickMeeting")]
        public async Task<IActionResult> StartQuickMeeting([FromQuery] string name)
        {
            var res = new TransferObject();
            var meetingId = await _service.StartQuickMeeting(name);
            if (_service.Status)
            {
                res.Data = meetingId;
            }
            else
            {
                await res.GetMessage("0001", _service);
            }
            return Ok(res);
        }

        [HttpGet("GetInfoMeeting/{meetingId}")]
        public async Task<IActionResult> GetInfoMeeting([FromRoute] string meetingId)
        {
            var res = new TransferObject();
            var data = await _service.GetInfoMeeting(meetingId);
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

        [HttpPost("CreateMeeting")]
        public async Task<IActionResult> CreateMeeting([FromBody] MeetingInfoDto request)
        {
            var res = new TransferObject();
            await _service.CreateMeeting(request);
            if (_service.Status)
            {
                await res.GetMessage("0100", _service);
            }
            else
            {
                res.MessageObject = _service.MessageObject;
                res.Status = false;
                //await res.GetMessage("1", _service);
            }
            return Ok(res);
        }


        /// <summary>
        /// Lấy chi tiết cuộc họp để edit
        /// </summary>
        [HttpGet("Detail/{meetingId}")]
        public async Task<IActionResult> GetMeetingDetail([FromRoute] string meetingId)
        {
            var res = new TransferObject();
            var data = await _service.GetMeetingDetail(meetingId);
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

        /// <summary>
        /// Cập nhật thông tin cuộc họp
        /// </summary>
        [HttpPost("UpdateMeeting")]
        public async Task<IActionResult> UpdateMeeting([FromBody] MeetingInfoDto request)
        {
            var res = new TransferObject();


            var meeting = await _service.GetInfoMeeting(request.Id);
            if (meeting == null)
            {
                res.Status = false;
                res.MessageObject = new MessageObject
                {
                    MessageDetail = "Không tìm thấy cuộc họp!"
                };
                return Ok(res);
            }

            // 2. Không cho phép sửa cuộc họp đã kết thúc
            if (meeting.Status == MeetingStatus.KetThuc)
            {
                res.Status = false;
                res.MessageObject = new MessageObject
                {
                    MessageDetail = "Không thể chỉnh sửa cuộc họp đã kết thúc!"
                };
                return Ok(res);
            }

            // 3. Nếu cuộc họp đang diễn ra, validate không được xóa thành viên
            if (meeting.Status == MeetingStatus.DangHop)
            {
                var currentPersonal = await _service.GetPersonalMeeting(request.Id);
                var currentUserNames = currentPersonal.Select(p => p.UserName).ToList();
                var newUserNames = request.Personal.Select(p => p.UserName).ToList();
                var removedUsers = currentUserNames.Except(newUserNames).ToList();

                if (removedUsers.Any())
                {
                    res.Status = false;
                    res.MessageObject = new MessageObject
                    {
                        MessageDetail = "Không thể gỡ thành viên đang tham gia cuộc họp!"
                    };
                    return Ok(res);
                }
            }

            // ============ GỌI SERVICE XỬ LÝ ============
            await _service.UpdateMeeting(request);

            if (_service.Status)
            {
                await res.GetMessage("0115", _service);

                // ✅ Gửi SignalR notification nếu cuộc họp đang diễn ra
                if (meeting.Status == MeetingStatus.DangHop)
                {
                    await _signalR.Clients.All.SendAsync("ReceiveNotification", new
                    {
                        meetingId = request.Id,
                        action = SignalRAction.UpdateMeeting,
                        message = "Thông tin cuộc họp đã được cập nhật!"
                    });
                }
            }
            else
            {
                await res.GetMessage("0103", _service);
            }

            return Ok(res);
        }

        /// <summary>
        /// Xóa cuộc họp (chỉ cho phép xóa cuộc họp chưa bắt đầu)
        /// </summary>
        [HttpDelete("DeleteMeeting/{meetingId}")]
        public async Task<IActionResult> DeleteMeeting([FromRoute] string meetingId)
        {
            var res = new TransferObject();

            var meeting = await _service.GetInfoMeeting(meetingId);

            if (meeting == null)
            {
                res.Status = false;
                res.MessageObject = new MessageObject
                {
                    MessageDetail = "Không tìm thấy cuộc họp!"
                };
                return Ok(res);
            }

            if (meeting.Status != MeetingStatus.ChuaBatDau)
            {
                res.Status = false;
                res.MessageObject = new MessageObject
                {
                    MessageDetail = "Chỉ có thể xóa cuộc họp chưa bắt đầu!"
                };
                return Ok(res);
            }

            await _service.DeleteMeeting(meetingId);

            if (_service.Status)
            {
                await res.GetMessage("0113", _service);
            }
            else
            {
                await res.GetMessage("0114", _service);
            }

            return Ok(res);
        }

        [HttpPost("SaveVoiceToText")]
        public async Task<IActionResult> SaveVoiceToText([FromBody] FileDto request)
        {
            var res = new TransferObject();
            await _service.SaveVoiceToText(request);
            if (_service.Status)
            {
                await res.GetMessage("0103", _service);
            }
            else
            {
                await res.GetMessage("0104", _service);
            }
            return Ok(res);
        }

        [HttpGet("ExportPersonal/{meetingId}")]
        public async Task<IActionResult> ExportPersonal([FromRoute] string meetingId)
        {
            var fileBytes = await _service.ExportPersonal(meetingId);
            string fileName = $"DanhSachHop_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        #region Action SignalR

        [HttpPost("RaiseHand")]
        public async Task<IActionResult> RaiseHand([FromBody] NotifyRequest request)
        {
            var account = await _service.GetAccountInfo(request.Username);
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                action = SignalRAction.RaiseHand,
                message = $"{account?.FullName} ({account?.Title?.Name}) đăng ký phát biểu!"
            });

            return Ok(new TransferObject());
        }

        [HttpPost("StartMeeting")]
        public async Task<IActionResult> StartMeeting([FromBody] NotifyRequest request)
        {
            await _service.UpdateStatusMeeting(request.MeetingId, MeetingStatus.DangHop);
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                action = SignalRAction.StartMeeting,
                message = $"Chủ trì đã bắt đầu cuộc họp!"
            });

            return Ok(new TransferObject());
        }

        [HttpPost("EndMeeting")]
        public async Task<IActionResult> EndMeeting([FromBody] NotifyRequest request)
        {
            await _service.UpdateStatusMeeting(request.MeetingId, MeetingStatus.KetThuc);
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                action = SignalRAction.EndMeeting,
                message = $"Chủ trì đã kết thúc cuộc họp! Xem lại thông tin cuộc họp trong phần danh sách!"
            });

            return Ok(new TransferObject());
        }

        [HttpPost("StartRecording")]
        public async Task<IActionResult> StartRecording([FromBody] NotifyRequest request)
        {
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                action = SignalRAction.StartRecord,
                message = $"Cuộc họp đang được ghi hình"
            });

            return Ok(new TransferObject());
        }

        [HttpPost("EndRecording")]
        public async Task<IActionResult> EndRecording([FromBody] NotifyRequest request)
        {
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                action = SignalRAction.EndRecord,
                message = $"Cuộc họp đã dừng ghi hình"
            });

            return Ok(new TransferObject());
        }

        [HttpGet("IntoTheMeeting/{meetingId}")]
        public async Task<IActionResult> IntoTheMeeting([FromRoute] string meetingId)
        {
            await _service.JoinMeeting(meetingId);
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = meetingId,
                action = SignalRAction.IntoTheMeeting,
                message = $"Vào cuộc họp"
            });

            return Ok(new TransferObject());
        }

        [HttpGet("ExitTheMeeting/{meetingId}")]
        public async Task<IActionResult> ExitTheMeeting([FromRoute] string meetingId)
        {
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = meetingId,
                action = SignalRAction.ExitTheMeeting,
                message = $"Thoát cuộc họp"
            });

            return Ok(new TransferObject());
        }

        [HttpPost("SendMessage")]
        public async Task<IActionResult> SendMessage([FromBody] MeetingMessageDto request)
        {
            await _service.SendMessage(request);
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                username = request.SenderUserId,        
                senderUserId = request.SenderUserId,   
                receiverUserId = request.ReceiverUserId, 
                messageText = request.MessageText,       
                action = SignalRAction.SendMessage,
                message = $"{request.SenderUserId} đã gửi tin nhắn",
                timestamp = DateTime.Now
            });
            return Ok(new TransferObject());
        }

        [HttpPost("GetListMessage")]
        public async Task<IActionResult> GetListMessage([FromBody] MeetingMessageDto request)
        {
            var res = new TransferObject();
            var messages = await _service.GetListMessage(request);
            if (_service.Status)
            {
                res.Data = messages;
            }
            
            return Ok(res);
        }

        [HttpPost("CreateMeetingVote")]
        public async Task<IActionResult> CreateMeetingVote([FromBody] MeetingVoteDto request)
        {
            var res = new TransferObject();
            await _service.CreateMeetingVote(request);
            if (_service.Status)
            {
                await res.GetMessage("0100", _service);
            }
            else
            {
                await res.GetMessage("0101", _service);
            }
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                action = SignalRAction.CreateMeetingVote,
            });
            return Ok(res);
        }

        [HttpPost("AnswerVote")]
        public async Task<IActionResult> AnswerVote([FromBody] MeetingVoteResultsDto request)
        {
            var res = new TransferObject();
            await _service.AnswerVote(request);
            if (_service.Status)
            {
                await res.GetMessage("0109", _service);
            }
            else
            {
                await res.GetMessage("0110", _service);
            }

            return Ok(res);
        }

        [HttpPost("StartVoting")]
        public async Task<IActionResult> StartVoting([FromBody] MeetingVoteDto request)
        {
            await _service.StartVoting(request);
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                voteId = request.Id,
                action = SignalRAction.StartVoting,
                message = $"Biểu quyết {request.Name} đã được bắt đầu!"
            });

            return Ok(new TransferObject());
        }

        [HttpPost("EndVoting")]
        public async Task<IActionResult> EndVoting([FromBody] MeetingVoteDto request)
        {
            await _service.EndVoting(request);
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                action = SignalRAction.EndVoting,
                message = $"Biểu quyết {request.Name} đã kết thúc!"
            });

            return Ok(new TransferObject());
        }

        [HttpPost("ControlParticipant")]
        public async Task<IActionResult> ControlParticipant([FromBody] NotifyRequest request)
        {
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                username = request.Username,
                action = SignalRAction.ControlParticipant,
                controlAction = request.Action,
                value = request.Value,
                message = $"Điều khiển thành viên"
            });

            return Ok(new TransferObject());
        }

        [HttpPost("KickParticipant")]
        public async Task<IActionResult> KickParticipant([FromBody] NotifyRequest request)
        {
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                username = request.Username,
                action = SignalRAction.KickParticipant,
                message = $"Chủ trì đã mời bạn ra khỏi cuộc họp!"
            });

            return Ok(new TransferObject());
        }


        [HttpPost("SyncParticipantState")]
        public async Task<IActionResult> SyncParticipantState([FromBody] NotifyRequest request)
        {
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                username = request.Username,
                action = SignalRAction.SyncParticipantState,
                controlType = request.Action,
                value = request.Value
            });
            return Ok(new TransferObject());
        }

        [HttpPost("ToggleAllMedia")]
        public async Task<IActionResult> ToggleAllMedia([FromBody] NotifyRequest request)
        {
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                action = SignalRAction.ToggleAllMedia,
                mediaType = request.Action,
                value = request.Value
            });
            return Ok(new TransferObject());
        }

        [HttpPost("BroadcastTranscription")]
        public async Task<IActionResult> BroadcastTranscription([FromBody] TranscriptionRequest request)
        {
            await _signalR.Clients.All.SendAsync("ReceiveNotification", new
            {
                meetingId = request.MeetingId,
                action = SignalRAction.BroadcastTranscription,
                username = request.Username,
                text = request.Text,
                isFinal = request.IsFinal
            });

            return Ok(new TransferObject());
        }
        #endregion
    }
}
