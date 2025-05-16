export default {
    get: async (id: bigint): Promise<Connection> => {
        return await __Api.GetConnection(id);
    },
};
