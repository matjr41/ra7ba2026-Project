'use client';

import { useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// تحميل React Quill ديناميكياً (client-side only)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'اكتب وصف المنتج بالتفصيل...',
  height = '300px'
}: RichTextEditorProps) {
  // معالج رفع الصور
  const imageHandler = useMemo(() => {
    return function(this: any) {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      const quill = this.quill;

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        // تحويل الصورة إلى Base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', imageUrl);
            quill.setSelection(range.index + 1);
          }
        };
        reader.readAsDataURL(file);

        // TODO: رفع الصورة إلى ImgBB أو سيرفر آخر
        // const imageUrl = await uploadImageToImgBB(file);
        // quill.insertEmbed(range.index, 'image', imageUrl);
      };
    };
  }, []);

  // إعدادات شريط الأدوات
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        // تنسيق النص
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        
        // الألوان
        [{ 'color': [] }, { 'background': [] }],
        
        // تنسيق الخط
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        
        // القوائم والمحاذاة
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        
        // الروابط والصور
        ['link', 'image', 'video'],
        
        // تنظيف التنسيق
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), [imageHandler]);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image', 'video',
    'clean'
  ];

  return (
    <div className="rich-text-editor" dir="rtl">
      <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: ${height};
          font-family: 'Cairo', sans-serif;
          font-size: 16px;
          direction: rtl;
          text-align: right;
        }
        
        .rich-text-editor .ql-editor {
          min-height: ${height};
          direction: rtl;
          text-align: right;
        }
        
        .rich-text-editor .ql-toolbar {
          background: #f8f9fa;
          border-radius: 8px 8px 0 0;
          border: 1px solid #e5e7eb;
          direction: ltr;
        }
        
        .rich-text-editor .ql-container {
          border-radius: 0 0 8px 8px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
          right: 15px;
          left: auto;
        }
        
        /* تحسين الأزرار */
        .rich-text-editor .ql-toolbar button {
          width: 32px;
          height: 32px;
          margin: 2px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .rich-text-editor .ql-toolbar button:hover {
          background: #e5e7eb;
        }
        
        .rich-text-editor .ql-toolbar button.ql-active {
          background: #8b5cf6;
          color: white;
        }
        
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #4b5563;
        }
        
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: white;
        }
        
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: #4b5563;
        }
        
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: white;
        }
        
        /* تحسين القوائم المنسدلة */
        .rich-text-editor .ql-toolbar select {
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          padding: 4px 8px;
        }
        
        .rich-text-editor .ql-picker-label {
          border-radius: 4px;
        }
        
        .rich-text-editor .ql-picker-label:hover {
          background: #e5e7eb;
        }
        
        /* تحسين المحتوى */
        .rich-text-editor .ql-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        
        .rich-text-editor .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        
        .rich-text-editor .ql-editor h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 10px 0;
        }
        
        .rich-text-editor .ql-editor a {
          color: #8b5cf6;
          text-decoration: underline;
        }
        
        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          padding-right: 1.5em;
          padding-left: 0;
        }
      `}</style>
      
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white"
      />
    </div>
  );
}
