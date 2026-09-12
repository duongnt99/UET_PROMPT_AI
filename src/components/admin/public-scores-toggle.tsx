"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setPublicScoresEnabledAction } from "@/server/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/form";

export function PublicScoresToggle({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const nextEnabled = !enabled;

  const confirm = () => {
    startTransition(async () => {
      const result = await setPublicScoresEnabledAction(nextEnabled);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
    });
  };

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">Công khai điểm trên Bảng đấu</h2>
          {enabled ? (
            <p className="mt-1 text-sm text-emerald-800">
              Điểm số hiện đang được công khai trên Bảng đấu trực tiếp.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              Cho phép người xem công khai xem kết quả chấm điểm chi tiết của các trận đủ điều kiện trên Bảng đấu trực tiếp.
            </p>
          )}
        </div>

        <AlertDialog.Root open={open} onOpenChange={setOpen}>
          <AlertDialog.Trigger asChild>
            <Button type="button" variant={enabled ? "outline" : "primary"} disabled={pending}>
              {enabled ? "Ẩn điểm trên Bảng đấu" : "Công khai điểm trên Bảng đấu"}
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
            <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <AlertDialog.Title className="text-lg font-semibold text-slate-900">
                {nextEnabled ? "Công khai điểm trên Bảng đấu?" : "Ẩn điểm khỏi Bảng đấu?"}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-3 whitespace-pre-line text-sm text-slate-600">
                {nextEnabled
                  ? "Sau khi công khai, người truy cập Bảng đấu trực tiếp có thể xem kết quả chấm điểm của các trận đã hoàn tất và đủ điều kiện công bố.\n\nCác nhận xét riêng của giám khảo và dữ liệu nội bộ sẽ không được công khai.\n\nBạn có chắc chắn muốn tiếp tục?"
                  : "Điểm số chi tiết sẽ không còn hiển thị trên Bảng đấu trực tiếp.\n\nDữ liệu chấm điểm không bị xóa và có thể công khai lại sau."}
              </AlertDialog.Description>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <AlertDialog.Cancel asChild>
                  <Button type="button" variant="outline" disabled={pending}>Hủy</Button>
                </AlertDialog.Cancel>
                <Button
                  type="button"
                  variant={nextEnabled ? "primary" : "destructive"}
                  onClick={(event) => {
                    event.preventDefault();
                    confirm();
                  }}
                  disabled={pending}
                >
                  {nextEnabled ? "Công khai điểm" : "Ẩn điểm"}
                </Button>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    </Card>
  );
}
