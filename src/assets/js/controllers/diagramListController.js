class DiagramListController {
    constructor() {
        this.diagramRepository = new diagramRepository();

        $.get("views/diagramList.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());

    }

    /**
     * Sets up the diagram list page
     * @param data which should be used to set up the page
     */
    setup(data) {
        //Load the diagram-content into memory
        this.diagramListView = $(data);

        this.setupList();

        this.addEventListeners();

        //Empty the content-div and add the resulting view to the page
        $(".content").empty().append(this.diagramListView);

        this.setLoader();
    }

    /**
     * Specify what certain elements should do at certain moments
     */
    addEventListeners() {
        this.diagramListView.find("form").on('submit', (e) => {
            e.preventDefault();
            this.search($('#searchBar').val());
        })
        this.diagramListView.find("#resetSearch button").on('click', () => {
            this.resetSearch();
        })
    }

    /**
     * Fill the table with all the data
     * @returns {Promise<void>}
     */
    async setupList() {
        // Get the diagram information
        try {
            const diagramInformation = await this.diagramRepository.getAllDiagrams();

            this.fillTable(diagramInformation);
        } catch (e) {
            $(".loading").hide();
            this.error();
        }
    }

    /**
     * Set the loader
     */
    setLoader() {
        // Set top to not let it overlap the navbar
        $(".loading").css("top", $(".sidebar").height());

        // Hide for the time being
        $(".main").hide();
    }


    /**
     * Called when the html failed to load.
     */
    error() {
        $(".content").html("<h3 class='text-center my-5'>Er is iets fout gegaan!</h3>")
    }

    /**
     * Fill the table with the given data
     * @param data - data that will fill the table
     * @returns {Promise<void>}
     */
    async fillTable(data) {

        // If there is no data
        if (data.length === 0) {
            // Hide and show relevant data
            $(".loading").hide();
            $("table").hide();
            $(".main").show();

            // Remove if it was already shown
            $(".noResults").remove();
            $("#search").append(`<div class="text-center noResults my-5"><h3>Er zijn geen resultaten.</h3></div>`)

        } else {
            // Empty first to prevent overfilling when the navbar-link is clicked multiple times
            $(".table-body").empty();

            // Remove if it was shown
            $(".noResults").remove();


            try {
                const progress = await this.diagramRepository.getAllProgress(sessionManager.get("userId"));

                // Check if the diagram has been completed and add it to the table
                for (const element of data) {
                    let completed = "❌";

                    // Check if diagram is found in list with completed diagrams
                    if ((progress.find(({completed_diagram}) => completed_diagram === element.id))) {
                        completed = "✔";
                    }

                    // Make a row in the table for each diagram
                    $(`<tr scope="row"><td>${element.name}</td><td class="text-right">${completed}</td></tr>`)
                        .attr("data-id", element.id)
                        .addClass('linkToDiagram')
                        .appendTo('.table-body');
                }

                $('table.paginated').each(function (newChild, refChild) {
                    //  document.getElementById('abc').remove();
                    var currentPage = 0;
                    var numPerPage = 10;
                    var $table = $(this);
                    $table.bind('repaginate', function () {
                        $table.find('tbody tr').hide().slice(currentPage * numPerPage, (currentPage + 1) * numPerPage).show();
                    });
                    $table.trigger('repaginate');
                    var numRows = $table.find('tr').length;
                    var numPages = Math.ceil(numRows / numPerPage);
                    var $pager = $('<div class="pager"></div>');

                    for (var page = 0; page < numPages; page++) {

                        $('<span id="number" class="page-number"></span>').text(page + 1).bind('click', {
                            newPage: page
                        }, function (event) {
                            currentPage = event.data['newPage'];
                            $table.trigger('repaginate');
                            $(this).addClass('active').siblings().removeClass('active');

                        }).appendTo($pager).addClass('clickable');
                    }
                    $pager.insertBefore($table).find('span.page-number:first').addClass('active');
                    // $pager.insertBefore($table, refChild).find('span.page-number:first').addClass('active');
                });

                // Event listener for the link
                $(".linkToDiagram").on("click", (element) => this.switchToDiagram(element.currentTarget));

                $(".loading").hide();
                $("table").show();
                $(".main").show();

            } catch (e) {
                $(".loading").hide();
                this.error();
            }
        }
    }

    /**
     * Redirect user to diagram by id when clicking on a link
     * @param element - clicked element
     */
    switchToDiagram(element) {
        let id = parseInt($(element).attr("data-id"));
        app.loadController(CONTROLLER_DIAGRAM, id);
    }

    /**
     * Show the results for the term and show the reset button if needed
     * @param term - term that should be searched for
     * @returns {Promise<void>}
     */
    async search(term) {

        // Remove the old pagenumber buttons to prevent duplicates
        $(".pager").remove();

        // Don't show the reset button if nothing was filled in
        if (term !== "") {
            this.diagramListView.find("#resetSearch").show();
        } else {
            this.diagramListView.find("#resetSearch").hide();
        }
        // Try to fill the table with the search results
        try {
            const results = await this.diagramRepository.searchFor(term);

            this.fillTable(results);
        } catch (e) {
            console.log(e);
            this.error();
        }
    }

    /**
     * Hide the reset button, clear the input and show all the diagrams
     */
    resetSearch() {
        $("#resetSearch").hide();
        $("#searchBar").val("");
        this.search("");
    }
}



