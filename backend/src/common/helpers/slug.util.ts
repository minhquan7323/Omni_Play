import slugify from 'slugify';

export const generateSlug = (title: string): string => {
    const baseSlug = slugify(title, {
        lower: true,
        locale: 'vi',
        strict: true,
    });
    return `${baseSlug}-${Date.now().toString().slice(-6)}`;
};
