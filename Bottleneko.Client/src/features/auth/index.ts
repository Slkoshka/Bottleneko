export const storageAccessTokenKey = 'neko-access-token';

export const saveAccessToken = function (accessToken: string) {
    localStorage.setItem(storageAccessTokenKey, accessToken);
};

export const getAccessToken = function () {
    return localStorage.getItem(storageAccessTokenKey);
};
