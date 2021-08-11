class ClassesAndStudentsRepository {
    constructor() {
        this.route = "/administration";
    }

    async getNumberOfClasses(id) {
        return await networkManager.doRequest(`${this.route}/getLimit`, {"id": id})
    }

    async getClasses(id) {
        return await networkManager.doRequest(`${this.route}/getClasses`, {"id": id})
    }

    async getCountClasses(id) {
        return await networkManager.doRequest(`${this.route}/getCountClasses`, {"id": id});
    }

    async getClass(id) {
        return await networkManager.doRequest(`${this.route}/getClass`, {"id": id})
    }

    async getStudentInfo(id) {
        return await networkManager.doRequest(`${this.route}/getStudentInfo`, {"id": id})
    }

    async getStudentProgress(id) {
        return await networkManager.doRequest(`${this.route}/getStudentProgress`, {"id": id})
    }

    async addStudent(name, username, password, classId) {
        return await networkManager.doRequest(`${this.route}/addStudent`, {
            "name": name,
            "username": username,
            "password": password,
            "class": classId
        })
    }

    async editStudent(name, username, password, studentId) {
        return await networkManager.doRequest(`${this.route}/editStudent`, {
            "name": name,
            "username": username,
            "password": password,
            "student": studentId
        })
    }

    async deleteStudent(studentId) {
        return await networkManager.doRequest(`${this.route}/deleteStudent`, {"student": studentId})
    }

    async moveStudent(studentId, classId) {
        return await networkManager.doRequest(`${this.route}/moveStudent`, {"student": studentId, "class": classId})
    }

    async checkUsernameExist(username) {
        return await networkManager.doRequest(`${this.route}/checkUsername`, {"username": username})
    }

    async addClass(id, name) {
        return await networkManager.doRequest(`${this.route}/addClass`, {"name": name, "docent": id})
    }

    async deleteClass(id, name) {
        return await networkManager.doRequest(`${this.route}/deleteClass`, {"name": name, "docent": id})
    }
    async deleteClassById(id) {
        return await networkManager.doRequest(`${this.route}/deleteClassById`, {"class":  id})
    }

    async editName(name, id) {
        return await networkManager.doRequest(`${this.route}/editName`, {"name":  name, "id": id})
    }
}