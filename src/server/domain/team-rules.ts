export function validateTeamSize(params: {
  acceptedMemberCount: number;
  minSize: number;
  maxSize: number;
}): { ok: boolean; message?: string } {
  if (params.minSize > params.maxSize) {
    return { ok: false, message: "Cấu hình sĩ số đội không hợp lệ." };
  }
  if (params.acceptedMemberCount < params.minSize) {
    return {
      ok: false,
      message: `Đội cần tối thiểu ${params.minSize} thành viên đã chấp nhận lời mời.`,
    };
  }
  if (params.acceptedMemberCount > params.maxSize) {
    return {
      ok: false,
      message: `Đội không được vượt quá ${params.maxSize} thành viên.`,
    };
  }
  return { ok: true };
}

export function canInviteMember(params: {
  allowTeamInvitations: boolean;
  teamLocked: boolean;
}): { ok: boolean; message?: string } {
  if (params.teamLocked) {
    return { ok: false, message: "Đội đã khóa. Chỉ quản trị viên mới được thay đổi thành viên." };
  }
  if (!params.allowTeamInvitations) {
    return { ok: false, message: "Ban Tổ chức chưa cho phép mời thành viên đội." };
  }
  return { ok: true };
}
