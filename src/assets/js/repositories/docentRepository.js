/**
 * Repository responsible for all user data from server - CRUD
 * Make sure all functions are using the async keyword when interacting with network!
 *
 */
class DocentRepository {

    constructor() {
        this.route = "/docent"
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

    async delete() {

    }


    async register(username, password) {

    }

    async update(id, values = {}) {

    }
}
