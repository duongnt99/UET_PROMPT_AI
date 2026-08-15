export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div>
        <h1 className="display text-4xl">Không có quyền truy cập</h1>
        <p className="mt-2 text-slate-600">Tài khoản của bạn không được phép mở trang này.</p>
      </div>
    </div>
  );
}
