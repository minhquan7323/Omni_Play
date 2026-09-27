'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

type FormFieldType = 'text' | 'number' | 'date' | 'textarea' | 'file' | 'searchable-select' | 'readonly';

function SearchableSelect({ label, value, onChange, placeholder, options, isMulti = false }: any) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const selectedIds = isMulti ? (value || '').split(',').map((s: string) => s.trim()).filter(Boolean) : [value].filter(Boolean);

    const toggleOption = (id: string, name: string) => {
        if (isMulti) {
            if (selectedIds.includes(id)) {
                onChange(selectedIds.filter((x: string) => x !== id).join(', '));
            } else {
                onChange([...selectedIds, id].join(', '));
            }
        } else {
            onChange(id);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
            <div
                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm cursor-pointer min-h-[42px] flex items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{selectedIds.length > 0 ? `${selectedIds.length} mục đã chọn` : placeholder}</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg p-2 max-h-60 overflow-y-auto">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="w-full px-3 py-2 mb-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none"
                    />
                    <div className="space-y-1">
                        {options
                            ?.filter((opt: any) => (opt.name || opt.title || '').toLowerCase().includes(search.toLowerCase()))
                            .map((opt: any) => (
                                <div
                                    key={opt.id}
                                    onClick={() => toggleOption(opt.id, opt.name || opt.title)}
                                    className={`px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-muted/50 flex items-center gap-2 ${selectedIds.includes(opt.id) ? 'bg-primary/20 text-primary font-medium' : ''}`}
                                >
                                    {opt.image || opt.thumbnailUrl ? <img src={opt.image || opt.thumbnailUrl} className="w-6 h-6 rounded-md object-cover" /> : null}
                                    {opt.name || opt.title}
                                </div>
                            ))}
                        {options.length === 0 && <div className="text-center text-xs text-muted-foreground py-2">Không tìm thấy</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

const FileInput = ({ label, accept, onChange, file }: { label: string, accept: string, onChange: (f: File | null) => void, file: File | string | null }) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = React.useState<{ type: 'image' | 'audio', url: string } | null>(null);

    React.useEffect(() => {
        if (file instanceof File) {
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreview({ type: 'image', url });
                return () => URL.revokeObjectURL(url);
            } else if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                setPreview({ type: 'audio', url });
                return () => URL.revokeObjectURL(url);
            }
        } else if (typeof file === 'string') {
            if (accept.includes('image')) {
                setPreview({ type: 'image', url: file });
            } else if (accept.includes('audio')) {
                setPreview({ type: 'audio', url: file });
            }
        } else {
            setPreview(null);
        }
    }, [file, accept]);

    return (
        <div>
            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
            <div
                onClick={() => fileRef.current?.click()}
                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm flex items-center justify-between cursor-pointer hover:bg-muted/70 transition-colors"
            >
                <div className="flex items-center gap-2 truncate">
                    {preview?.type === 'image' && <img src={preview.url} alt="Preview" className="w-6 h-6 rounded object-cover" />}
                    <span className="truncate text-muted-foreground">{file instanceof File ? file.name : (typeof file === 'string' ? 'File hiện tại (click để đổi)' : 'Chọn file...')}</span>
                </div>
                <Upload className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            </div>
            {preview?.type === 'audio' && (
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <audio controls src={preview.url} className="w-full h-10 rounded-lg outline-none" />
                </div>
            )}
            <input
                type="file"
                ref={fileRef}
                accept={accept}
                onChange={(e) => onChange(e.target.files?.[0] || null)}
                className="hidden"
            />
        </div>
    );
};

export interface FormField {
    name: string;
    label: string;
    type: FormFieldType;
    placeholder?: string;
    accept?: string;
    rows?: number;
    helperText?: React.ReactNode;
    options?: any[];
    isMulti?: boolean;
    renderValue?: (value: any) => React.ReactNode;
    onChangeSideEffect?: (value: any, setForm: (updates: any) => void) => void;
}

export function DynamicFormModal({
    title,
    fields,
    initialData,
    onSubmit,
    onClose,
    isPending
}: {
    title: string;
    fields: FormField[];
    initialData: Record<string, any>;
    onSubmit: (formData: Record<string, any>) => void;
    onClose: () => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<Record<string, any>>(initialData);

    const handleChange = (name: string, value: any) => {
        setForm(prev => {
            const next = { ...prev, [name]: value };
            const field = fields.find(f => f.name === name);
            if (field?.onChangeSideEffect) {
                field.onChangeSideEffect(value, (updates: any) => setForm(c => ({ ...c, ...updates })));
            }
            return next;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5 shrink-0">
                    <h3 className="font-bold text-foreground">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
                </div>

                <div className="space-y-3 overflow-y-auto px-1 flex-1">
                    {fields.map((f) => (
                        <div key={f.name}>
                            {f.type !== 'file' && f.type !== 'searchable-select' && (
                                <label className="text-xs text-muted-foreground mb-1 flex justify-between">
                                    <span>{f.label}</span>
                                    {f.helperText && <span className="text-[10px] opacity-70">{f.helperText}</span>}
                                </label>
                            )}

                            {f.type === 'text' || f.type === 'number' || f.type === 'date' ? (
                                <input
                                    type={f.type}
                                    value={form[f.name] || ''}
                                    onChange={(e) => handleChange(f.name, e.target.value)}
                                    placeholder={f.placeholder}
                                    className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            ) : f.type === 'textarea' ? (
                                <textarea
                                    value={form[f.name] || ''}
                                    onChange={(e) => handleChange(f.name, e.target.value)}
                                    rows={f.rows || 3}
                                    placeholder={f.placeholder}
                                    className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono text-[11px]"
                                />
                            ) : f.type === 'readonly' ? (
                                <div className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground">
                                    {f.renderValue ? f.renderValue(form[f.name]) : form[f.name]}
                                </div>
                            ) : f.type === 'searchable-select' ? (
                                <SearchableSelect
                                    label={f.label}
                                    value={form[f.name] || ''}
                                    onChange={(v: string) => handleChange(f.name, v)}
                                    placeholder={f.placeholder}
                                    options={f.options}
                                    isMulti={f.isMulti}
                                />
                            ) : f.type === 'file' ? (
                                <FileInput
                                    label={f.label}
                                    accept={f.accept || '*/*'}
                                    file={form[f.name] || null}
                                    onChange={(file) => handleChange(f.name, file)}
                                />
                            ) : null}
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 mt-5 shrink-0">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50">Hủy</button>
                    <button onClick={() => onSubmit(form)} disabled={isPending}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                        {isPending ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}