class DeleteDiagramController {
    constructor() {
        this.diagramRepository = new diagramRepository();
        this.diagramManagementRepository = new diagramManagementRepository();

        $.get("views/deleteDiagram.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());

    }

    /**
     * Sets up the diagram list page
     * @param data which should be used to set up the page
     */
    setup(data) {
        //Load the diagram-content into memory
        this.deleteDiagramView = $(data);

        this.setupList();

        //Empty the content-div and add the resulting view to the page
        $(".content").empty().append(this.deleteDiagramView);

        // Set top to not let it overlap the navbar
        $(".loading").css("top", $(".sidebar").height());

        // Hide for the time being
        $("table").hide();


    }

    /**
     * Called when the html failed to load.
     */
    error() {
        $(".content").html("<h3 class='text-center my-5'>Er is iets fout gegaan!</h3>")
    }


    async setupList() {
        // Get the diagram information
        try {
            const diagramInformation = await this.diagramRepository.getDiagram2(sessionManager.get("userId"));
            const progress = await this.diagramRepository.getAllProgress(sessionManager.get("userId"));

            // Empty first to prevent overfilling when the navbar-link is clicked multiple times
            $(".table-body").empty();

            for (const element of diagramInformation) {
                let completed = "❌";

                // Check if diagram is found in list with completed diagrams
                if ((progress.find(({completed_diagram}) => completed_diagram === element.id))) {
                    completed = "✔";
                }

                // Make a row in the table for each diagram
                $(`<tr scope="row"><td>${element.name}</td></tr>`)
                    .attr("data-id", element.id)
                    .addClass('linkToDiagram')
                    .appendTo('.table-body');
            }

            // Event listener for the link
            $(".linkToDiagram").on("click", (element) => this.switchToDiagram(element.currentTarget));

            $(".loading").hide();
            $("table").show();

        } catch (e) {
            $(".loading").hide();
            this.error();
        }
    }

    /**
     * Deletes the selected diagram
     * @param element - clicked element
     */
    async switchToDiagram(element) {
        let id = parseInt($(element).attr("data-id"));
        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-danger'
            },
            buttonsStyling: false
        })

        swalWithBootstrapButtons.fire({
            title: 'Bevestiging',
            text: "Weet je het zeker dat je deze diagram wilt verwijderen?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ja',
            cancelButtonText: 'Nee',
            reverseButtons: true
        }).then((result) => {

            if (result.value) {
                console.log(id)
                $(element).remove();
                swalWithBootstrapButtons.fire(
                    'Verwijderd!'
                )
                return this.diagramManagementRepository.deleteDiagram(id)
            }
        })
}
}
