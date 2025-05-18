export default {
    get: async (id: bigint): Promise<Connection | null> => {
        return await __Api.GetConnection(id);
    },
};
