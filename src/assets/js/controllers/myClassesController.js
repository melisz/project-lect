class MyClassesController {
    constructor() {
        this.classesAndStudentsRepository = new ClassesAndStudentsRepository();

        $.get("views/my-classes.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());

    }

    /**
     * Sets up the diagram list page
     * @param data which should be used to set up the page
     */
    setup(data) {
        //Load the diagram-content into memory
        this.myClassesView = $(data);

        //Empty the content-div and add the resulting view to the page
        $(".content").empty().append(this.myClassesView);

        // Set top to not let it overlap the navbar
        $(".loading").css("top", $(".sidebar").height());
        $("main").hide();

        this.initPage();
    }

    /**
     * Called when the html failed to load.
     */
    error() {
        $(".content").html("<h3 class='text-center my-5'>Er is iets fout gegaan!</h3>")
    }

    /**
     * Get the right text, classes and buttons for the page.
     * Also add the event listeners.
     * @returns {Promise<void>}
     */
    async initPage() {
        try {
            this.allClasses = await this.classesAndStudentsRepository.getClasses(sessionManager.get('userId'));

            this.getTextAndButtons().then(() => {
                this.getClasses();
                $(".loading").hide();
                $("main").show()
            })

            this.myClassesView.find('#addClass').on('click', () => this.addClass());
            this.myClassesView.find('#deleteClass').on('click', () => this.deleteClass());
        } catch (e) {
            console.log(e);
            this.error();
        }

    }

    /**
     * Get the right text and buttons for adding and/or removing classes
     * @returns {Promise<void>}
     */
    async getTextAndButtons() {
        try {
            const numberOfClasses = await this.classesAndStudentsRepository.getNumberOfClasses(sessionManager.get('userId'));
            const numberOfUsedClasses = this.allClasses.length;
            const numberOfAvailableClasses = numberOfClasses - numberOfUsedClasses;


            if (numberOfClasses === numberOfUsedClasses) {  // If all spots are filled
                this.myClassesView.find('#textAvailableClasses').hide();
                this.myClassesView.find('#addClass').hide();
                this.myClassesView.find('#deleteClass').show();

            } else {
                this.myClassesView.find('#textAvailableClasses').show();
                this.myClassesView.find('#addClass').show();

                // Get the right available classes text
                if (numberOfAvailableClasses === 1) {
                    this.myClassesView.find('#textAvailableClasses').text('U kunt nog 1 klas toevoegen.')
                } else {
                    this.myClassesView.find('#textAvailableClasses').text(`U kunt nog ${numberOfAvailableClasses} klassen toevoegen.`)
                }

                if (numberOfUsedClasses === 0) { // If they have not added any class yet
                    this.myClassesView.find('#deleteClass').hide()
                } else { // If they have not used up all the classes yet
                    this.myClassesView.find('#deleteClass').show();
                }
            }
        } catch (e) {
            console.log(e);
            this.error();
        }
    }

    /**
     * Make a card for each class
     * @returns {Promise<void>}
     */
    getClasses() {
        // If there are no classes and the h3 is not there yet
        if (this.allClasses.length === 0
            && !(this.myClassesView.find('#textAvailableClasses').parent().find('h3').length)) {
            this.myClassesView.find('#textAvailableClasses').after(`
                <div class="font-italic mt-5">
                <h3>U heeft nog geen klassen toegevoegd.</h3>
                </div>`)
        }

        this.myClassesView.find('.card-deck').empty();

        this.allClasses.forEach((el) => {
            let numberOfStudentsText;
            if (el.numberOfStudents === 1) {
                numberOfStudentsText = '1 leerling'
            } else {
                numberOfStudentsText = `${el.numberOfStudents} leerlingen`
            }


            this.myClassesView.find('.card-deck').append(
                `<div class="card classCard p-3 my-1 mx-auto" data-id="${el.id}" >
                    <div class="card-block">
                        <h4 class="card-title">${el.name}</h4>
                        <p class="card-text"><small class="text-muted">${numberOfStudentsText}</small></p>
                    </div>
                </div>`
            );
        });

        // Event listener
        this.myClassesView.find(".classCard").on("click", (element) => {
            this.switchToClass(element.currentTarget)
        });
    }

    /**
     * Redirect to the class page
     * @param element which was clicked on
     */
    switchToClass(element) {
        let id = parseInt($(element).attr("data-id"));
        app.loadController(CONTROLLER_CLASS, id);
    }

    /**
     *  Show the right alerts for adding a class.
     *  On confirm, add the class.
     */
    addClass() {
        const self = this;

        swal.mixin({
            confirmButtonText: 'Voeg toe',
            showCancelButton: true,
            cancelButtonText: "Annuleer",
            reverseButtons: true
        }).queue([
            {
                title: "Wat is de naam van de klas?",
                input: 'text',
                inputValidator: (value) => {
                    return new Promise((resolve) => {
                        if (value.length > 45) {
                            resolve('De naam van de klas is te lang.')
                        } else if (value.trim() === '') {
                            resolve('U moet een naam invoeren voor de klas.')
                        } else if (self.allClasses.find(({name}) => name === value)) {
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
                try {// Try to add the class
                    await self.classesAndStudentsRepository.addClass(sessionManager.get('userId'), className);

                    swal.fire({
                        icon: 'success',
                        title: 'Gelukt!',
                        text: `${className} is toegevoegd!`,
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


                self.initPage();
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
        const classesArray = [];

        // Create array for the input
        self.allClasses.forEach((element) => {
            classesArray.push(element.name)
        })

        swal.queue([
            {
                title: "Welke klas wilt u verwijderen?",
                input: 'select',
                inputPlaceholder: 'Selecteer een klas',
                inputOptions: classesArray,
                inputValidator: (value) => {
                    return new Promise((resolve) => {
                        if (value !== "") {
                            console.log(value)
                            resolve()
                        } else {
                            resolve('U moet een klas selecteren.')
                        }
                    })
                },
                confirmButtonText: 'Verwijder',
                showCancelButton: true,
                cancelButtonText: "Annuleer",
                reverseButtons: true,
                preConfirm: (val) => {
                    swal.insertQueueStep({
                        html: `Weet u zeker dat u <strong>${classesArray[val]}</strong> wil verwijderen?<br><hr>
                                <small><em>Dit houdt in dat alle leerlingen in deze klas ook 
                                verwijderd worden en dus niet meer zullen kunnen inloggen.</em><hr>
                                U kunt dit <strong class="text-danger">niet</strong> ongedaan maken!</small>`,
                        confirmButtonText: 'Verwijder',
                        showCancelButton: true,
                        cancelButtonText: "Annuleer",
                        reverseButtons: true
                    })
                }
            }
        ]).then(async (result) => {
            if (result.value) {
                const classToBeDeleted = classesArray[(result.value[0])];

                try { // Try to delete the class
                    await self.classesAndStudentsRepository.deleteClass(sessionManager.get('userId'), classToBeDeleted);

                    swal.fire({
                        icon: 'success',
                        title: 'Gelukt!',
                        text: `${classToBeDeleted} is verwijderd!`,
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

                self.initPage();
            }
        })
    }
}