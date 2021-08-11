class diagramRepository {
    constructor() {
        this.route = "/diagram"
    }

    async getAllDiagrams() {
        return await networkManager.doRequest(`${this.route}/all`, {}, 'GET');
    }

    async getTotalDiagrams() {
        return await networkManager.doRequest(`${this.route}/getTotal`, {}, 'GET');
    }

    async getDiagram(id) {
        return await networkManager.doRequest(`${this.route}/withId`, {"id": id});
    }

    async getDiagram2(creator) {
        return await networkManager.doRequest(`${this.route}/withCreator`, {"creator": creator});
    }


    async searchFor(term) {
        return await networkManager.doRequest(`${this.route}/search`, {"term": term});

    }

    async setProgress(user, diagram) {
        return await networkManager.doRequest(`${this.route}/setProgress`,
            {"user": user, "diagram": diagram})
    }

    async getProgress(user, diagram) {
        return await networkManager.doRequest(`${this.route}/getProgress`,
            {"user": user, "diagram": diagram})
    }

    async getProgressList(user) {
        return await networkManager.doRequest(`${this.route}/getProgressList`,
            {"user": user})
    }

    async getAllProgress(user) {
        return await networkManager.doRequest(`${this.route}/getAllProgress`,
            {"user": user})
    }

    async getProgressForDiagram(classId, diagramId) {
        return await networkManager.doRequest(`${this.route}/getProgressForDiagram`,
            {"class": classId, "diagram": diagramId})
    }
}

