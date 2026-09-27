export const connectIds = (ids?: string[]) => {
    return ids?.length ? { connect: ids.map(id => ({ id })) } : undefined;
};