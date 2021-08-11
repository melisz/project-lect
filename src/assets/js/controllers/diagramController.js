/**
 * Controller responsible for the events in the diagram view
 */
class DiagramController {
    constructor(id) {

        this.diagramRepository = new diagramRepository();

        $.get("views/diagram.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());

        // Id of the diagram
        this.id = id;
    }

    /**
     * Called when the diagram.html has been loaded
     * @param data - the html file
     */
    setup(data) {
        const self = this;

        //Load the diagram-content into memory
        this.diagramView = $(data);

        // See whether the user has already completed the diagram
        this.getProgress();

        setTimeout(function () {
            self.getDiagramInformation().then(function () {
                self.setDiagram(self.getChartConfig(
                    self.diagramInformation.root_orientation,
                    JSON.parse(self.diagramInformation.node_structure)));

                self.setExplanation();
            });
        }, 200)


        // Event listener for the button
        this.diagramView.find("#getResult").on("click", () => this.showResult());

        //Empty the content-div and add the resulting view to the page
        $(".content").empty().append(this.diagramView);
    }

    /**
     * Called when the diagram.html failed to load.
     */
    error() {
        $(".content").html("Er is iets fout gegaan bij het laden van het diagram. Probeer het opnieuw.");
    }

    /**
     * Gets information of the diagram by id.
     * @returns {Promise<*>}
     */
    async getDiagramInformation() {

        try {
            const information = await this.diagramRepository.getDiagram(this.id);
            this.diagramInformation = information[0];
        } catch (e) {
            this.error();
        }

    }

    showProgressNotification() {
        /*$(".content").prepend(`
        <div class="alert alert-warning alert-dismissible fade show my-1 text-center" role="alert">
             <strong>Let op: </strong> Je hebt dit diagram al een keer eerder opgelost,
              dus je zult <strong>niet</strong> opnieuw punten krijgen.
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                 </button>
        </div>
                            `)*/

        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: (7 * 1000),
            timerProgressBar: true,
            onOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        })

        Toast.fire({
            icon: 'warning',
            html: '&nbsp;&nbsp;<strong>Let op: </strong> Je hebt dit diagram al een keer eerder opgelost,<br>' +
                '              dus je zult <strong >niet </strong> opnieuw punten krijgen.'
        })
    }

    async getProgress() {
        try {
            const progress = await this.diagramRepository.getProgress(sessionManager.get("userId"), this.id);
            if (progress[0].completed === 1) {
                this.hasCompletedBefore = true;
                this.showProgressNotification();
            } else {
                this.hasCompletedBefore = false;
            }
        } catch (e) {
            this.error();
        }
    }

    /**
     * Gets the configuration for the chart.
     * @param rootOrientation - orientation of the root
     * @param nodeStructure - structure of nodes
     * @returns the chart configuration
     */
    getChartConfig(rootOrientation, nodeStructure) {
        // Configuration for tree diagram
        return {
            // Config for the chart
            /*  See https://fperucic.github.io/treant-js/ > Construction & Initialization
                for an detailed explanation on the config */
            chart: {
                container: "#diagram",
                rootOrientation: rootOrientation,
                connectors: {
                    type: "step"
                },
                node: {
                    // Add class 'droparea' to each node
                    HTMLclass: "droparea",
                }


            },

            // data-*  is used to give data attributes to the elements
            // (https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)
            nodeStructure: nodeStructure
        };
    }

    /**
     * Get answers from database.
     * @returns {Promise<*>}
     */
    async getAnswers() {
        // Array of the answers
        return this.diagramInformation.answers;
    }

    /**
     * Get center X of draggable
     */
    calculateCenterX() {
        let item = $(".item");
        return Math.floor(item.width() / 2);

    }

    /**
     * Get center Y of draggable
     */
    calculateCenterY() {
        let item = $(".item");
        return Math.floor(item.height() / 2);

    }

    /**
     * Make the list of answers sortable and draggable
     */
    createSortable() {
        const self = this;

        // Create a sortable list for the answers
        $("#listOfWords").sortable({
            // Place cursor at center of element when dragging
            cursorAt: {
                left: Math.floor(self.calculateCenterX() / 2),
                top: self.calculateCenterY()
            },
            tolerance: "pointer",

            // Cancel the dragging if it has the cancel class
            // NOTE: the cancel class is added to the element when the div that it was dragged to is already filled
            sort: function () {
                if ($(this).hasClass("cancel")) {
                    $(this).sortable("cancel");
                }
                self.setExplanation();
            }
        });

    }

    /**
     * Calculates the user's progress
     */
    calculateProgress() {
        let numerator = $(".droparea").find(".item").length - 1
        let denominator = $('.droparea').length - 1
        let progress = Math.round(numerator / denominator * 100) + 1
        $(function () {
            $("#progressbar").progressbar({
                value: progress
            })
        })
        $("#percentage").text(progress - 1 + "%" +
            "");
        $("#progressbar .ui-progressbar-value").animate(
            {
                width: progress + "%",
                height: "20px"
            });
    }

    /**
     * Make the diagram draggable
     *
     */
    createDroppable() {
        const self = this;

        // Make the droparea's droppable
        $(".droparea").droppable({
            tolerance: "pointer",
            // Which items can be dropped in this div
            accept: ".item",
            // What should happen when an item is dropped
            drop: function (event, ui) {
                self.setExplanation();
                const item = ui.draggable.clone();
                const $thisDraggable = $(this);

                // Check whether the div has already been filled with a word and send it back to the sortable if it is
                if ($thisDraggable.children().length >= 1) {
                    item.addClass("cancel");
                } else {
                    ui.draggable.remove();
                    item.appendTo($thisDraggable).removeAttr("style").removeClass("my-1").css("margin", "-1px");
                }

                // Make items draggable when they're not in the sortable
                item.draggable({
                    // Place cursor at center of element when dragging
                    cursorAt: {
                        left: self.calculateCenterX(),
                        top: self.calculateCenterY()
                    },
                    connectToSortable: "#listOfWords",
                    containment: ".wordsContainer",
                    stop: function () {
                        const $thisItem = $(this);

                        // Make sure that the dragged word is in the right place by changing its style properties
                        // (Left and top properties define its position)
                        if ($thisItem.parent().hasClass("ui-sortable")) {
                            $thisItem.removeAttr("style").addClass("my-1");
                        } else {
                            $thisItem.attr("style", "margin: -1px");
                        }

                    }
                })
                // Calculate the user's progress
                self.calculateProgress();
            }
        })

    }

    /**
     * Randomize the order of the answers and place them on the diagram
     */
    setAnswers() {
        const self = this;

        let answers;
        self.getAnswers().then((response) => {
            answers = JSON.parse(response);

            // Randomize the order of the answers in the array
            answers.sort(function () {
                return (Math.round(Math.random()) - 0.5);
            });


            // Place the answers in the list of words
            for (let i = 0; i < answers.length; i++) {
                let id = answers[i].text;
                id = id.replace(/\s+/g, '').toLowerCase();

                $('<div><p class="d-table-cell text-center align-middle">' + answers[i].text + '</p></div>')
                    .attr("data-parent", answers[i].parent)
                    .attr("id", id)
                    .addClass('item d-table my-1')
                    .appendTo('#listOfWords')
                    // Disable text selection
                    .disableSelection();
            }

            // Fills the first drop-area with answer and fits
            $('*[data-veld="1"]').append($('*[data-parent=""]').removeClass("my-1").css("margin", "-1px"))

            // Set height of list of words area
            $("#listOfWords").css("min-height", $("#diagram").height());
        })


    }

    /**
     * Create new Chart
     * @param config - the configuration for the tree
     */
    setDiagram(config) {
        const self = this;
        new Treant(
            // Configuration
            config,

            // Action that's performed after the tree has been loaded
            function () {
                setTimeout(function () {
                    self.createSortable();
                    self.createDroppable();
                }, 100);
                self.setAnswers();
                self.setDescriptionHandler();
                self.userProgress();
            },

            // This will provide animation support, ability to get TreeNode class instances directly from the DOM using
            // .data( 'treenode' );, and many more features since jQuery is available.
            $);
    }

    /**
     * Get descriptions from database.
     * @returns {Promise<*>}
     */
    async getDescriptions() {
        return this.diagramInformation.descriptions;
    }

    setDescriptionHandler() {
        const self = this;
        this.diagramView.find(".node").on("click", function () {
            // This refers to the clicked node
            self.setDescription($(this));
        });
    }

    /**
     * Display the corresponding description on click of an node.
     */
    setDescription(clickedElement) {
        const self = this;
        // Clickable data-veld with questions
        const veld = $(clickedElement).data("veld");

        if (veld) { // If the clicked field has a value
            self.getDescriptions().then((response) => {
                let descriptions = JSON.parse(response);

                    // Search for the description of the clicked field
                    let descriptionOfClickedObject = descriptions.find(o => o.veld === veld);

                //Empty the description field
                $("#opdrachtomschrijving").text("");

                let speed = 40;
                let charCount = 0;

                // Start the type writer
                typeWriter();

                function typeWriter() {
                    // Check if all the characters are in the description yet
                    if (charCount < descriptionOfClickedObject.text.length) {

                        document.getElementById("opdrachtomschrijving").innerHTML += descriptionOfClickedObject.text.charAt(charCount);
                        charCount++;
                        // Disable clicking other elements while 'typing'
                        $(".node").off("click");
                        // Repeat until completed
                        setTimeout(typeWriter, speed);
                    } else {
                        // Enable clicking again
                        self.setDescriptionHandler();
                    }

                }
            });
        }

    }

    /**
     * Check the answers by comparing the actual parent by the current parent.
     * Apply the corresponding borders to the items and return the number
     * of correct answers.
     * @returns correctAnswers - return array of answers and information about them
     */
    getCheckedAnswers() {
        let correctAnswers = [];

        $(".node").each(function () {

            const thisNode = $(this);

            // Get the text of the parent of the current node
            const thisNodeParentveld = thisNode.data("parentveld")
            const textOfCurrentParentNode = $('*[data-veld=' + thisNodeParentveld + ']').find('.item p').text();

            // Get the text of what should be the parent of the current node
            const item = thisNode.find('.item');
            const textOfActualParentNode = item.data("parent");

            const thisNodeVeldNumber = thisNode.data("veld");
            const thisNodeText = thisNode.find('.item p').text();


            if (textOfActualParentNode === textOfCurrentParentNode) {
                item.css("border-color", "green");
                correctAnswers.unshift({position: thisNodeVeldNumber, text: thisNodeText, correct: true});
            } else {
                item.css("border-color", "red");
                correctAnswers.unshift({position: thisNodeVeldNumber, text: thisNodeText, correct: false});
            }

            item
                .css("border-width", "thick")
                .css("border-style", "solid")
        });

        return correctAnswers;
    }

    /**
     * Count the correct answers by checking for each answer if it's correct
     * @returns the number of correct answers
     */
    getNumberOfCorrectAnswers() {
        const answerArray = this.getCheckedAnswers();
        let numberOfCorrectAnswers = 0;

        answerArray.forEach(element => {
            if (element.correct) {
                numberOfCorrectAnswers++;
            }
        })

        return numberOfCorrectAnswers;
    }

    /**
     * Get the explanation of the diagram
     * @returns {Promise<*>}
     */
    async getExplanation() {
        return this.diagramInformation.explanation;
    }

    /**
     * Replace the empty spots in the explanation with the filled in answers
     * @returns the string with the answers filled in
     */
    getExplanationWithAnswers() {
        return (
            this.getExplanation().then((data) => {
                let explanationString = data;

                // Place each word in the explanation string
                this.getCheckedAnswers().forEach(element => {

                    let elementText = element.text;
                    let colorOfText = (element.correct ? "green" : "red");

                    // Search for spots ([i]) where the word should be placed
                    const getBracketsGlobally = new RegExp(`\\[${element.position}\\]`, "g");
                    let matches = (explanationString.match(getBracketsGlobally) || []).length;

                    // Place each word while there are still open spots for the word
                    while (matches > 0) {

                        // Regex for looking for the first open spot (so not globally)
                        const getBrackets = new RegExp(`\\[${element.position}\\]`);

                        /**
                         * Check if it's gonna be the first word in the sentence by
                         * checking if there's a period or nothing (in case it's the first sentence) before it
                         * @returns whether it's the first word of the sentence
                         */
                        function isFirstWordOfSentence() {

                            let twoCharactersBeforeWord = explanationString.charAt
                            (explanationString.indexOf(`[${element.position}]`) - 2);
                            return (twoCharactersBeforeWord === "." || twoCharactersBeforeWord === "");

                        }

                        // Check if it's the first word of the sentence and lowercase it if it is
                        let textToBePlaced = elementText;
                        if (!(isFirstWordOfSentence())) {
                            textToBePlaced = textToBePlaced.toLowerCase();
                        }

                        let word = `<span style="color: ${colorOfText}; font-weight: bold">${textToBePlaced}</span>`;

                        // Place the word in the explanation string
                        explanationString = explanationString.replace(getBrackets, word);

                        matches--;
                    }
                });

                return explanationString;
            }));
    }

    /**
     * Set the progress for the user
     * @returns {Promise<*>}
     */
    async setProgress() {
        this.hasCompletedBefore = true;
        return await this.diagramRepository.setProgress(sessionManager.get("userId"), this.id);
    }

    /**
     * Show the result of the given answers.
     */
    async showResult() {
        const self = this;
        let numItems = $('.droparea').length;

        // Statement that checks if all fields have been filled with words.
        if ($(".droparea").find(".item").length < numItems) {
            swal.fire({
                title: "Probeer het nog een keer",
                text: "Alle velden moeten zijn ingevuld.",
                icon: "warning"
            })
        } else {

            const correctAnswers = self.getNumberOfCorrectAnswers();
            const explanation = await self.getExplanationWithAnswers();
            // Statement that checks if all answers are correct.
            if (correctAnswers === numItems) {

                //------------------------------------------------------------//

                if(sessionManager.get("type") === "leerling") {

                    $('.typewritertext4').hide();
                    $('.typewritertext3').show();
                    $('.typewritertext5').hide();

                    var txt = 'Whoohooo!!!';
                    var i = 0;
                    var speed = 50;

                    document.getElementById("goed").innerHTML = "";

                    function typeWriter() {

                        if (i < txt.length) {
                            document.getElementById('goed').innerHTML += txt.charAt(i);
                            i++;
                            setTimeout(typeWriter, speed);
                        }
                    }

                    typeWriter();

                    // ----- Change the figure image -----
                    var image2 = document.getElementById("icon");

                    //change the source of the image
                    image2.src = "../src/assets/img/happy.png";

                    if( document.getElementById("icon").className === "diagramLijstIcon2"  ){
                        image2.classList.replace('diagramLijstIcon2', 'winner');
                    } else {
                        image2.classList.replace('loser', 'winner');
                    }
                }
                // ----- ------- ------------------///

                let alertTekst;

                if (!self.hasCompletedBefore && sessionManager.get("type") === "leerling") {
                    const userRepository = new UserRepository();
                    await userRepository.updateBalance(sessionManager.get("userId"), correctAnswers)

                    self.setProgress();

                    await app.getNavbar().setBalance();
                    alertTekst = "Je hebt " + correctAnswers + " punten behaald.";
                } else if (sessionManager.get("type") === "docent") {
                    alertTekst = "U heeft het diagram succesvol voltooid!";
                } else {
                    alertTekst = "Je had alle punten al gehaald voor deze opdracht.";
                }

                swal.mixin({
                    confirmButtonText: 'Bekijk de uitleg',
                    showCancelButton: true,
                    cancelButtonText: "Sluit af"
                }).queue([
                    {
                        title: "Goed gedaan!",
                        text: alertTekst,
                        icon: "success"
                    }
                ]).then((result) => {
                    if (result.value) {
                        swal.fire({
                            title: 'De uitleg',
                            html: explanation,
                            confirmButtonText: 'Ok!'
                        })
                    }
                })
                // $('#getResult').prop('disabled', true);
            } else {

                //--------------------------

                if(sessionManager.get("type") === "leerling") {

                    // ------------- Change the figure image -----------------//
                    var image = document.getElementById("icon");

                    //change the source of the image
                    image.src = "../src/assets/img/figurewrong.png";


                    if (document.getElementById("icon").className === "diagramLijstIcon2") {

                        image.classList.replace('diagramLijstIcon2', 'loser');
                    } else {
                        image.classList.replace('winner', 'loser');
                    }

                    // ----- ------- -----

                    $('.typewritertext4').hide();
                    $('.typewritertext3').hide();
                    $('.typewritertext5').show();

                    var txt = 'Dat zag niemand...' + '\nSnel probeer het opnieuw!';
                    var i = 0;
                    var speed = 30;

                    document.getElementById('fout').innerHTML = "";

                    function typeWriter() {

                        if (i < txt.length) {
                            document.getElementById('fout').innerHTML += txt.charAt(i);
                            i++;
                            setTimeout(typeWriter, speed);
                        }
                    }
                    typeWriter();
                }

                //--------------------------------

                swal.fire({
                    html: `<h5>Kijk wat er niet klopt en
                            <br>probeer het daarna nog een keer.</h5>
                            <p>` + explanation + `</p>`,
                    icon: "error",
                })
            }


        }
    }

    /**
     * Show the user's progress
     */
    userProgress() {
        let self = this
        //Set percentage to zero
        $(function () {
            $("#progressbar").progressbar({value: 0})
            $("#progresstext").html("<p id='percentage'>0%<p>");

            //When item is dropped
        })
        $("#listOfWords").droppable({
            tolerance: "pointer",
            // Which items can be dropped in this div
            accept: ".item",
            // Calculate the user's progress
            drop: function () {
                self.calculateProgress()
            }

        })
        //Change color of progressbar depending on the user's progress
        $("#progressbar").bind('progressbarchange', function () {
            let selector = "#" + this.id + " > div";
            let value = this.getAttribute("aria-valuenow");
            if (value === 1) {
                $(selector).css({'background': 'White', 'border-color': 'White'});
            } else if (value < 25) {
                $(selector).css({'background': 'rgba(255,12,0,0.75)', 'border-color': 'rgba(255,12,0,0.75)'});
            } else if (value < 50) {
                $(selector).css({'background': '#ff9f46', 'border-color': '#ff9f46'});
            } else if (value < 75) {
                $(selector).css({'background': '#fff852', 'border-color': '#fff852'});
            } else {
                $(selector).css({'background': '#84ff9f', 'border-color': '#84ff9f'});
            }
        });

    }

    async setExplanation() {
        let explanationString = await this.getExplanation();

        // Place each word in the explanation string
        this.getPlacedElements().forEach(element => {
            let elementText = element.text;

            // Search for spots ([i]) where the word should be placed
            const getBracketsGlobally = new RegExp(`\\[${element.position}\\]`, "g");
            let matches = (explanationString.match(getBracketsGlobally) || []).length;

            // Place each word while there are still open spots for the word
            while (matches > 0) {

                // Regex for looking for the first open spot (so not globally)
                const getBrackets = new RegExp(`\\[${element.position}\\]`);

                /**
                 * Check if it's gonna be the first word in the sentence by
                 * checking if there's a period or nothing (in case it's the first sentence) before it
                 * @returns whether it's the first word of the sentence
                 */
                function isFirstWordOfSentence() {
                    let twoCharactersBeforeWord = explanationString.charAt
                    (explanationString.indexOf(`[${element.position}]`) - 2);
                    return (twoCharactersBeforeWord === "." || twoCharactersBeforeWord === "");

                }

                // Check if it's the first word of the sentence and lowercase it if it is
                let textToBePlaced = elementText;
                if (!(isFirstWordOfSentence())) {
                    textToBePlaced = textToBePlaced.toLowerCase();
                }

                let word = `<span style="font-weight: bold">${textToBePlaced}</span>`;

                // Place the word in the explanation string
                explanationString = explanationString.replace(getBrackets, word);

                matches--;
            }

        });

        this.diagramView.find('#explanation').html(explanationString);
    }

    getPlacedElements() {
        let placedElements = [];

        $(".node").each(function () {

            const thisNode = $(this);
            const thisNodeVeldNumber = thisNode.data("veld");
            const thisNodeText = thisNode.find('.item p').text();
            if (thisNodeText === "") {

                placedElements.unshift({position: thisNodeVeldNumber, text: " [...] "});
            } else {
                placedElements.unshift({position: thisNodeVeldNumber, text: thisNodeText});
            }
        });

        return placedElements;
    }
}

