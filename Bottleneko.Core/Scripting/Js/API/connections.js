export default {
    get: async (id) => {
        return await __Api.GetConnection(id);
    },
};
