'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-[0_0_30px_rgba(59,130,246,0.12)]">
          <h1 className="mb-6 text-3xl font-extrabold text-slate-900">سياسة الخصوصية</h1>
          <p className="mb-4 text-slate-600 leading-relaxed">
            نحرص على حماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع البيانات واستخدامها وحمايتها
            أثناء استخدامك لمتجرنا.
          </p>
          <h2 className="mt-8 mb-3 text-xl font-bold text-slate-900">البيانات التي نجمعها</h2>
          <ul className="list-disc pr-6 text-slate-600 space-y-2">
            <li>معلومات الاتصال الأساسية مثل الاسم ورقم الهاتف والعنوان.</li>
            <li>تفاصيل الطلبات وسجل المشتريات.</li>
            <li>بيانات تقنية لتحسين الأداء وتجربة المستخدم.</li>
          </ul>
          <h2 className="mt-8 mb-3 text-xl font-bold text-slate-900">كيفية الاستخدام</h2>
          <p className="text-slate-600 leading-relaxed">
            نستخدم البيانات لمعالجة الطلبات، تحسين تجربتك، وتقديم دعم العملاء، مع الالتزام بعدم مشاركتها
            مع أي طرف ثالث دون موافقتك إلا عند الضرورة القانونية.
          </p>
          <h2 className="mt-8 mb-3 text-xl font-bold text-slate-900">حقوقك</h2>
          <p className="text-slate-600 leading-relaxed">
            يمكنك طلب تحديث أو حذف بياناتك في أي وقت عبر صفحة الدعم.
          </p>
        </div>
      </div>
    </div>
  );
}
