export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-6">
        <h1 className="text-3xl font-bold mb-3">المتجر غير موجود</h1>
        <p className="text-gray-600 mb-6">هذا الدومين غير مرتبط بأي متجر نشط.</p>
        <a href="/" className="px-5 py-2 rounded-lg bg-blue-600 text-white">العودة للمنصة</a>
      </div>
    </div>
  );
}
