class ShopRepository {
    constructor() {
        this.route = "/shop"
    }

    async getBoughtCursors(userId) {
        return await networkManager.doRequest(`${this.route}/getBoughtCursors`, {"userId": userId});
    }

    async getAllCursors() {
        return await networkManager.doRequest(`${this.route}/getAllCursors`)
    }

    async buyCursor(cursorId, userId) {
        return await networkManager.doRequest(`${this.route}/buyCursor`, {"cursor": cursorId, "user": userId})
    }

    async getCursorPrice(cursorId) {
        return await networkManager.doRequest(`${this.route}/getCursorPrice`, {"cursorId": cursorId});
    }
}