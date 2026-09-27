import * as bcrypt from 'bcrypt';
const saltRounds = 10;

export const hashData = async (data: string) => {
    try {
        return await bcrypt.hash(data, saltRounds);
    } catch (error) {
        console.error(error);
    }
};

export const compareHashData = async (
    data: string,
    hashData: string | null,
) => {
    try {
        return await bcrypt.compare(data, hashData);
    } catch (error) {
        console.error(error);
    }
};
