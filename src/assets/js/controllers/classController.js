const MAX_STUDENTS = 35;

class ClassController {
    constructor(id) {
        this.id = id;
        this.classesAndStudentsRepository = new ClassesAndStudentsRepository();
        this.diagramRepository = new diagramRepository();

        $.get('views/class.html')
            .done((data) => this.setup(data))
            .fail(() => this.error());
    }

    /**
     * Intialize the page by putting the HTML in it
     * @param data - the HTML
     */
    setup(data) {
        this.classView = $(data);
        this.initPage();
        $('.content').empty().append(this.classView);
    }

    /**
     * Show that there has been an error to the user
     */
    error() {
        $(".content").html("<h3 class='text-center my-5'>Er is iets fout gegaan!</h3>")
    }

    /**
     * Initialize the page
     * @returns {Promise<void>}
     */
    async initPage() {
        this.classInformation = await this.classesAndStudentsRepository.getClass(this.id);
        this.initContent();
        this.getText();

        this.initSidebar();
        this.initButtons();
    }

    /**
     * Get the right header and subtext.
     */
    async getText() {
        this.classInformation = await this.classesAndStudentsRepository.getClass(this.id);
        this.classView.find('#className').text(this.classInformation.name);
        const currentNumberOfStudents = this.classInformation.numberOfStudents;

        let numberOfStudentsText;
        if (currentNumberOfStudents === 1) {
            numberOfStudentsText = '1 leerling'
        } else {
            numberOfStudentsText = `${currentNumberOfStudents} leerlingen`
        }
        this.classView.find('#numberOfStudents').text(numberOfStudentsText);

        let numberOfFreeSpotsText;

        if ((MAX_STUDENTS - currentNumberOfStudents) === 0) {
            numberOfFreeSpotsText = `U kunt geen leerlingen meer toevoegen. U heeft het limiet van ${MAX_STUDENTS} bereikt.`;
        } else if ((MAX_STUDENTS - currentNumberOfStudents) === 1) {
            numberOfFreeSpotsText = 'U kunt nog 1 leerling toevoegen.'
        } else {
            numberOfFreeSpotsText = `U kunt nog ${MAX_STUDENTS - currentNumberOfStudents} leerlingen toevoegen.`
        }

        this.classView.find('#numberOfFreeSpots').text(numberOfFreeSpotsText);
    }

    /**
     * Show the right content (table)
     */
    initContent() {
        let currentTab = this.classView.find('.activeLink').data('tab');

        switch (currentTab) {
            case 'login-data':
                this.getLoginDataTable();
                break;
            case 'overall-progress':
                this.getOverallProgressTable()
                break;
            case 'progress-of-diagram':
                this.initSelect();
                break;
        }
    }

    /**
     * Create the login data table
     * @returns {Promise<void>}
     */
    async getLoginDataTable() {
        let operateFormatter = `
        <a class="edit" title="Bewerken" href="javascript:void(0)">
            <i class="fas fa-user-edit">&nbsp;&nbsp;&nbsp;&nbsp;</i>
        </a>
        <a class="delete" title="Verwijderen" href="javascript:void(0)">
            <i class="fas fa-user-minus"></i>
        </a>`;

        // Add the button to move students if the logged in user has multiple classse
        if (await this.classesAndStudentsRepository.getCountClasses(sessionManager.get("userId")) > 1) {
            operateFormatter +=
                `<a class="move" title="Verplaatsen" href="javascript:void(0)">
                    &nbsp;&nbsp;&nbsp;&nbsp;<i class="fas fa-users"></i>
                 </a>`;
        }

        this.classView.find('#studentInfo').bootstrapTable({
            locale: "nl-NL",
            data: await this.classesAndStudentsRepository.getStudentInfo(this.id),
            pagination: true,
            pageSize: 8,
            search: true,
            columns: [{
                field: 'name',
                title: 'Naam',
                sortable: true
            }, {
                field: 'username',
                title: 'Inlognaam'
            }, {
                field: 'password',
                title: 'Wachtwoord'
            }, {
                field: 'operate',
                title: 'Bewerken',
                align: 'center',
                clickToSelect: false,
                events: {
                    'click .edit': (e, value, row) => {
                        this.editStudent(row.name, row.username, row.password, row.id);
                    },
                    'click .delete': (e, value, row) => {
                        this.deleteStudent(row.name, row.username, row.id);
                    },
                    'click .move': (e, value, row) => {
                        this.moveStudent(row.name, row.username, row.id);
                    }
                },
                formatter: operateFormatter
            }]
        })

    }

    /**
     * Create the overall progress table
     * @returns {Promise<void>}
     */
    async getOverallProgressTable() {

        const numberOfDiagrams = await this.diagramRepository.getTotalDiagrams();

        function progressFormatter(value) {
            return `${value}/${numberOfDiagrams} (${Math.round(value / numberOfDiagrams * 100)}%)`
        }

        this.classView.find('#overallProgressTable').bootstrapTable({
            locale: "nl-NL",
            data: await this.classesAndStudentsRepository.getStudentProgress(this.id),
            pagination: true,
            pageSize: 8,
            search: true,
            columns: [{
                field: 'name',
                title: 'Leerling',
                sortable: true
            }, {
                field: 'progress',
                title: 'Voortgang',
                sortable: true,
                formatter: progressFormatter
            }, {
                field: 'listOfCompletedDiagrams',
                title: 'Voortganglijst',
                width: 100,
                events: {
                    'click .list': (e, value, row, index) => {
                        this.getListDiagrams(row.name, row.id);
                    }
                },
                formatter: `<div class="text-center">
                                <a class="list" title="list" href="javascript:void(0)"><i class="fas fa-list"></i></a>
                            </div>`
            }]
        })

    }


    /**
     * Initialize the links in the sidebar
     */
    initSidebar() {
        const self = this;

        this.classView.find('a').on('click', function (e) {
            e.preventDefault();

            // Perform the right action for the clicked button
            if ($(this).prop('id') === 'deleteClass') {
                self.deleteClass();
            } else if ($(this).prop('id') === 'editName') {
                self.editName();
            } else {
                self.classView.find('.activeLink').removeClass('activeLink');

                $(this).addClass('activeLink');

                self.initContent();

                $('.tab').hide();

                // Show the clicked tab
                $(`#${$(this).data('tab')}`).show();
            }
        })
    }

    /**
     * Initialize the add student button
     */
    initButtons() {
        // Disable the button if the max count of students is reached
        if ((MAX_STUDENTS - this.classInformation.numberOfStudents) === 0) {
            this.classView.find('#addStudent').prop('disabled', true);
        }
        // Event listener for the add student button
        this.classView.find('#addStudent').on('click', async () => {
            this.addNewStudent();
        });
    }

    /**
     * Validate the data of a student
     * @param name - name of student
     * @param username - username of student
     * @param password - password of student
     * @returns {Promise<string>} - the result of the validation
     */
    async validateData(name, username, password) {
        // Validate name
        if (name === '') {
            return `Er moet een naam ingevuld worden.`
        } else if (name.length > 45) {
            return `De naam mag niet meer dan 45 karakters bevatten.`
        }

        // Validate username
        else if (username === '') {
            return `Er moet een inlognaam ingevuld worden.`;
        } else if (await this.classesAndStudentsRepository.checkUsernameExist(username)) {
            return `Deze inlognaam bestaat al. Kies iets anders.`;
        } else if (!username.match(/^[a-z0-9_-]{3,16}$/i)) {
            return `De inlognaam mag alleen letters, nummers, _ en - bevatten. 
            Daarnaast moet de lengte ook tussen de 3 en 16 karakters liggen.`
        }

        // Validate password
        else if (password === '') {
            return `Er moet een wachtwoord ingevuld worden.`;
        } else if (!password.match(/^[a-z0-9_-]{3,16}$/i)) {
            return `Het wachtwoord mag alleen letters, nummers, _ en - bevatten. 
            Daarnaast moet de lengte ook tussen de 3 en 16 karakters liggen.`
        }
    }

    /**
     * Alert for adding a new student
     */
    addNewStudent() {
        const formHTML = `<input type="text" id="name" class="swal2-input" placeholder="Naam van de leerling"/>
                    <input type="text" id="username" class="swal2-input" placeholder="Inlognaam"/>
                    <input type="text" id="password" class="swal2-input" placeholder="Wachtwoord"/>`;

        Swal.fire({
            title: 'Nieuwe leerling',
            showCancelButton: true,
            cancelButtonText: 'Annuleer',
            confirmButtonText: 'Voeg toe',
            html: formHTML,
            preConfirm: async () => {
                let name = Swal.getPopup().querySelector('#name').value
                let username = Swal.getPopup().querySelector('#username').value
                let password = Swal.getPopup().querySelector('#password').value

                if (await this.validateData(name, username, password)) {
                    Swal.showValidationMessage(await this.validateData(name, username, password))
                }

                return {name: name, username: username, password: password};
            }
        }).then(async (result) => {

            if (result.value) { // If data is filled in and submitted
                try {
                    await this.classesAndStudentsRepository.addStudent(result.value.name, result.value.username, result.value.password, this.id);

                    this.classView.find('#studentInfo').bootstrapTable('load', await this.classesAndStudentsRepository.getStudentInfo(this.id));
                    this.getText();
                    this.initButtons();

                    swal.fire({
                        icon: 'success',
                        title: 'Gelukt!',
                        text: `${result.value.name} is toegevoegd!`,
                        confirmButtonText: 'Ok!'
                    })

                } catch (e) {
                    console.log(e);
                    swal.fire({
                        icon: 'error',
                        title: 'Er is iets fout gegaan...',
                        text: `Probeer het later opnieuw.`,
                        confirmButtonText: 'Ok!'
                    })
                }
            }
        })
    }

    /**
     * Alert for editing an existing student
     * @param name - name of the student
     * @param username - username of the student
     * @param password - password of the student
     * @param studentId - id of the student
     */
    editStudent(name, username, password, studentId) {
        const formHTML = `<input type="text" id="name" class="swal2-input" placeholder="Naam van de leerling" value="${name}"/>
                    <input type="text" id="username" class="swal2-input" placeholder="Inlognaam" value="${username}"/>
                    <input type="text" id="password" class="swal2-input" placeholder="Wachtwoord" value="${password}"/>`;

        Swal.fire({
            title: 'Bewerk leerling',
            showCancelButton: true,
            cancelButtonText: 'Annuleer',
            confirmButtonText: 'Sla op',
            html: formHTML,
            preConfirm: async () => {
                let name = Swal.getPopup().querySelector('#name').value
                let username = Swal.getPopup().querySelector('#username').value
                let password = Swal.getPopup().querySelector('#password').value

                if (await this.validateData(name, username, password)) {
                    Swal.showValidationMessage(await this.validateData(name, username, password))
                }

                return {name: name, username: username, password: password};
            }
        }).then(async (result) => {

            if (result.value) { // If data is filled in and submitted
                try {
                    await this.classesAndStudentsRepository.editStudent(result.value.name, result.value.username, result.value.password, studentId);

                    this.classView.find('#studentInfo').bootstrapTable('load', await this.classesAndStudentsRepository.getStudentInfo(this.id));
                    this.getText();
                    this.initButtons();

                    swal.fire({
                        icon: 'success',
                        title: 'Gelukt!',
                        text: `De wijzigingen zijn opgeslagen!`,
                        confirmButtonText: 'Ok!'
                    })

                } catch (e) {
                    console.log(e);
                    swal.fire({
                        icon: 'error',
                        title: 'Er is iets fout gegaan...',
                        text: `Probeer het later opnieuw.`,
                        confirmButtonText: 'Ok!'
                    })
                }
            }
        })
    }

    /**
     * Alert for deleting a student
     * @param name - name of the student
     * @param username - username of the student
     * @param studentId - id of the student
     */
    deleteStudent(name, username, studentId) {
        const deleteHTML = `Weet u zeker dat u <strong>${name}</strong> (${username}) uit ${this.classInformation.name} wil verwijderen?`;

        Swal.fire({
            title: 'Verwijder leerling',
            showCancelButton: true,
            cancelButtonText: 'Annuleer',
            confirmButtonText: 'Verwijder',
            html: deleteHTML
        }).then(async (result) => {

            if (result.value) { // If data is filled in and submitted
                try {
                    await this.classesAndStudentsRepository.deleteStudent(studentId);

                    this.classView.find('#studentInfo').bootstrapTable('load', await this.classesAndStudentsRepository.getStudentInfo(this.id));
                    this.getText();
                    this.initButtons();

                    swal.fire({
                        icon: 'success',
                        title: 'Gelukt!',
                        text: `${name} is verwijderd!`,
                        confirmButtonText: 'Ok!'
                    })

                } catch (e) {
                    console.log(e);
                    swal.fire({
                        icon: 'error',
                        title: 'Er is iets fout gegaan...',
                        text: `Probeer het later opnieuw.`,
                        confirmButtonText: 'Ok!'
                    })
                }
            }
        })
    }

    /**
     * Alert for moving a student to another class
     * @param name - name of the student
     * @param username - username of the student
     * @param studentId - id of the student
     * @returns {Promise<void>}
     */
    async moveStudent(name, username, studentId) {
        const classes = new Map();
        const allClasses = await this.classesAndStudentsRepository.getClasses(sessionManager.get('userId'));
        // Create array for the input
        allClasses.forEach((element) => {
            if (element.name !== this.classInformation.name) {
                // classesArray.push({hi : element.name})
                classes.set(element.id, element.name);
            }
        })


        const moveHTML = `Naar welke klas wilt u <strong>${name}</strong> (${username}) uit ${this.classInformation.name} verplaatsen?`;

        Swal.fire({
            title: 'Verplaats leerling',
            showCancelButton: true,
            cancelButtonText: 'Annuleer',
            confirmButtonText: 'Verplaats',
            html: moveHTML,
            input: 'select',
            inputPlaceholder: 'Selecteer een klas',
            inputOptions: classes,
            inputValidator: (value) => {
                return new Promise((resolve) => {
                    if (value !== "") {
                        resolve()
                    } else {
                        resolve('U moet een klas selecteren.')
                    }
                })
            },
            preConfirm: (val) => {
                swal.insertQueueStep({
                    html: `Weet u zeker dat u <strong>${name}</strong> wil verplaatsen naar ${val}?<br><hr>
                                <small><em>Dit houdt in dat alle leerlingen in deze klas ook 
                                verwijderd worden en dus niet meer zullen kunnen inloggen.</em><hr>
                                U kunt dit <strong class="text-danger">niet</strong> ongedaan maken!</small>`,
                    confirmButtonText: 'Verwijder',
                    showCancelButton: true,
                    cancelButtonText: "Annuleer",
                    reverseButtons: true
                })
            }
        }).then(async (result) => {

            if (result.value) { // If data is filled in and submitted
                try {
                    await this.classesAndStudentsRepository.moveStudent(studentId, result.value);

                    this.classView.find('#studentInfo').bootstrapTable('load', await this.classesAndStudentsRepository.getStudentInfo(this.id));
                    this.getText();
                    this.initButtons();

                    swal.fire({
                        icon: 'success',
                        title: 'Gelukt!',
                        text: `${name} is verplaatst!`,
                        confirmButtonText: 'Ok!'
                    })

                } catch (e) {
                    console.log(e);
                    swal.fire({
                        icon: 'error',
                        title: 'Er is iets fout gegaan...',
                        text: `Probeer het later opnieuw.`,
                        confirmButtonText: 'Ok!'
                    })
                }
            }
        })
    }

    /**
     *
     * Show the right alerts for deleting a class.
     * On confirm, actually delete the class.
     */
    deleteClass() {
        const self = this;

        swal.queue([
            {
                html: `Weet u zeker dat u <strong>${this.classInformation.name}</strong> wil verwijderen?<br><hr>
                                <small><em>Dit houdt in dat alle leerlingen in deze klas ook 
                                verwijderd worden en dus niet meer zullen kunnen inloggen.</em><hr>
                                U kunt dit <strong class="text-danger">niet</strong> ongedaan maken!</small>`,
                confirmButtonText: 'Verwijder',
                showCancelButton: true,
                cancelButtonText: "Annuleer",
                reverseButtons: true
            }
        ]).then(async (result) => {

            if (result.value) {

                try { // Try to delete the class
                    await self.classesAndStudentsRepository.deleteClassById(this.id);

                    swal.fire({
                        icon: 'success',
                        title: 'Gelukt!',
                        text: `${this.classInformation.name} is verwijderd!`,
                        confirmButtonText: 'Ok!'
                    })

                    app.loadController(CONTROLLER_MY_CLASSES);

                } catch (e) {
                    console.log(e);
                    swal.fire({
                        icon: 'error',
                        title: 'Er is iets fout gegaan...',
                        text: `Probeer het later opnieuw.`,
                        confirmButtonText: 'Ok!'
                    })
                }
            }
        })
    }

    /**
     * Alert for editing the name of the class
     * @returns {Promise<void>}
     */
    async editName() {
        const self = this;

        swal.mixin({
            confirmButtonText: 'Wijzig',
            showCancelButton: true,
            cancelButtonText: "Annuleer",
            reverseButtons: true,
            onOpen: function () {
                const input = swal.getInput();
                $('body').find(input).attr('spellcheck', false);
            },
        }).queue([
            {
                title: "Vul hier de nieuwe naam in",
                input: 'text',
                inputValue: this.classInformation.name,
                inputValidator: (value) => {
                    return new Promise(async (resolve) => {
                        const allClasses = await this.classesAndStudentsRepository.getClasses(sessionManager.get('userId'));

                        if (value.length > 45) {
                            resolve('De naam van de klas is te lang.')
                        } else if (value.trim() === '') {
                            resolve('U moet een naam invoeren voor de klas.')
                        } else if (allClasses.find(({name}) => name === value)) {
                            resolve('U heeft al een klas met deze naam.')
                        } else {
                            resolve();
                        }
                    })
                },
            }
        ]).then(async (result) => {

            if (result.value) {
                const className = result.value[0];

                // Try to add the class
                try {
                    await self.classesAndStudentsRepository.editName(className, this.id);

                    swal.fire({
                        icon: 'success',
                        title: 'Gelukt!',
                        text: `De naam is veranderd naar ${className}.`,
                        confirmButtonText: 'Ok!'
                    })

                } catch (e) {
                    swal.fire({
                        icon: 'error',
                        title: 'Er is iets fout gegaan...',
                        text: `Probeer het later opnieuw.`,
                        confirmButtonText: 'Ok!'
                    })
                }

                await self.getText();
            }


        })
    }

    /**
     * Initialize modal and table for list of completed diagrams of a student
     * @param name - name of the user
     * @param id - id of the student
     * @returns {Promise<void>}
     */
    async getListDiagrams(name, id) {
        $('#afgerondeDiagrammenTitle').text(`Afgeronde diagrammen van ${name}:`)
        this.classView.find('#afgerondeDiagrammenTable').bootstrapTable({
            locale: "nl-NL",
            data: await this.diagramRepository.getProgressList(id),
            showLoading: true,
            pagination: true,
            pageSize: 8,
            search: true,
            columns: [{
                field: 'name',
                title: 'Naam',
                sortable: true
            }, {
                field: 'completed',
                title: 'Afgerond?',
                sortable: true
            }]
        })
        this.classView.find('#afgerondeDiagrammenTable').bootstrapTable('load', await this.diagramRepository.getProgressList(id));
        $('#afgerondeDiagrammen').modal()
    }

    /**
     * Initialize the select input for the progress per diagram.
     * @returns {Promise<void>}
     */
    async initSelect() {
        const self = this;

        const allDiagrams = await this.diagramRepository.getAllDiagrams();
        // Add the names of the diagrams as options to the select under the right group
        allDiagrams.forEach(function (el) {
            if (el.creator === sessionManager.get('userId')) { // If the creator of the current diagram is logged in...
                self.classView.find('#mine').append(`<option value="${el.id}">${el.name}</option>`)
            } else {
                self.classView.find('#other').append(`<option value="${el.id}">${el.name}</option>`)
            }
        });

        // Initialize the selectpicker and it's properties
        this.classView.find('.selectDiagram').selectpicker({
            title: 'Kies een diagram',
            liveSearch: true,
            liveSearchPlaceholder: 'Zoek naar een diagram',
        });

        let selectElement = $('#selectDiagram');
        let selectedValue = selectElement.val();

        // If there's a value selected, show the progress
        if (selectedValue) {
            checkProgress();
        } else { // Else hide the list
            self.classView.find('#lijstAfgerond').hide();
        }

        // Check the progress if something is selected
        this.classView.find('#selectDiagram').on('change', function () {
            checkProgress()
        })

        /**
         * Check the progress for the selected value
         *
         * @returns {Promise<void>}
         */
        async function checkProgress() {
            selectedValue = selectElement.val();
            self.classView.find('#lijstAfgerond').show();

            const progress = await self.diagramRepository.getProgressForDiagram(self.id, selectedValue);

            self.classView.find('#afgerond').empty();
            self.classView.find('#nogNietAfgerond').empty();

            progress.forEach(function (el) {
                if (el.completed) {
                    self.classView.find('#afgerond').append(`<li class="list-group-item list-group-item-success">${el.name}</li>`)
                } else {
                    self.classView.find('#nogNietAfgerond').append(`<li class="list-group-item list-group-item-danger">${el.name}</li>`)
                }
            })
        }

    }
}

