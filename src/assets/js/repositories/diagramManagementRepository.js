class diagramManagementRepository {
    constructor() {
        this.route = "/diagramManagement"
    }


    async getDiagram(id) {
        return await networkManager.doRequest(`${this.route}/withId`, {"id": id});
    }

    async addDiagram(creator, name, structure, answers, descriptions, explanation){
        return await networkManager.doRequest(`${this.route}/addDiagram`, {"creator": creator,"name": name, "structure": structure, "answers": answers, "descriptions": descriptions, "explanation": explanation});
    }

    async deleteDiagram(id){
        return await networkManager.doRequest(`${this.route}/deleteDiagram`, {"id": id});
    }
}
