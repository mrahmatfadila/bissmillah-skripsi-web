"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-64 flex items-center justify-center bg-muted animate-pulse rounded-md" />
});

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
        ],
    }), []);

    return (
        <div className="rich-text-editor-container bg-background">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                placeholder={placeholder || 'Tulis isi artikel di sini...'}
                className="bg-white text-black min-h-[300px] rounded-md"
            />
            {/* Some CSS overrides to make Quill look good in our theme */}
            <style jsx global>{`
                .rich-text-editor-container .ql-container {
                    min-height: 300px;
                    font-family: inherit;
                    font-size: 16px;
                    border-bottom-left-radius: 0.375rem;
                    border-bottom-right-radius: 0.375rem;
                }
                .rich-text-editor-container .ql-toolbar {
                    border-top-left-radius: 0.375rem;
                    border-top-right-radius: 0.375rem;
                    background-color: #f8fafc;
                }
                .dark .rich-text-editor-container .ql-toolbar {
                    background-color: #e2e8f0;
                }
                .dark .rich-text-editor-container .ql-editor {
                    color: black;
                }
                .dark .rich-text-editor-container .ql-editor.ql-blank::before {
                    color: rgba(0,0,0,0.6);
                }
            `}</style>
        </div>
    );
}
