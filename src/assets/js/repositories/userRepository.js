/**
 * Repository responsible for all user data from server - CRUD
 * Make sure all functions are using the async keyword when interacting with network!
 *
 */
class UserRepository {

    constructor() {
        this.route = "/user"
    }

    async getAll() {

    }

    /**
     * async function that handles a Promise from the networkmanager
     * @param username
     * @param password
     * @returns {Promise<user>}
     */
    async login(username, password) {
        return await networkManager
            .doRequest(`${this.route}/login`, {"username": username, "password": password});
    }

    async getBalance(id) {
        return await networkManager
            .doRequest(`${this.route}/getBalance`, {"id": id})
    }

    async updateBalance(id, points) {
        return await networkManager
            .doRequest(`${this.route}/updateBalance`, {"id": id, "points": points})
    }

    async setSelectedCursor(userId, cursorId) {
        return await networkManager
            .doRequest(`${this.route}/setSelectedCursor`, {"userId": userId, "cursorId": cursorId})
    }

    async getSelectedCursor(userId) {
        return await networkManager
            .doRequest(`${this.route}/getSelectedCursor`, {"userId": userId})
    }
    async delete() {

    }


    async register(username, password) {

    }

    async update(id, values = {}) {

    }
}
