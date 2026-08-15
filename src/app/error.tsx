"use client";

export default function ErrorPage({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div>
        <h1 className="display text-4xl">Đã xảy ra lỗi</h1>
        <p className="mt-2 text-slate-600">Hệ thống gặp sự cố. Hãy thử lại hoặc liên hệ Ban Tổ chức.</p>
        {process.env.NODE_ENV !== "production" ? (
          <pre className="mt-4 max-w-xl overflow-auto text-xs">{error.message}</pre>
        ) : null}
      </div>
    </div>
  );
}
