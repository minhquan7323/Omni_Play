import { useEffect, useState } from 'react';

export const useDebounce = (value: string, delay: number = 500) => {
    const [valueDebounce, setValueDebounce] = useState('');
    useEffect(() => {
        const handle = setTimeout(() => {
            setValueDebounce(value);
        }, delay);
        return () => {
            clearTimeout(handle);
        };
    }, [value, delay]);
    return valueDebounce;
};
