/**
 * Controller responsible for the events in the diagram view
 */
class CreateDiagramController {
    constructor() {
        this.diagramManagementRepository = new diagramManagementRepository();
        $.get("views/createDiagram.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());
    }

    //Called when the welcome.html has been loaded
    setup(data) {
        let self = this;
        //Load the welcome-content into memory
        this.createDiagramView = $(data);

        this.createDiagramView.find("#hassan").on("click", function () {
            // Pass the id to the method since the cursor is based on the id
            self.addName()
        });
        this.createDiagramView.find("#bassan").on("click", function () {
            // Pass the id to the method since the cursor is based on the id
            self.addExplanation()
        });


        this.createDiagramView.find("#generateDiagram").on("click", () => this.generateDiagram());
        this.createDiagramView.find("#addRow").on("click", () => this.addRow());


        this.addSelectOptions();
        //Empty the content-div and add the resulting view to the page
        $(".content").empty().append(this.createDiagramView);
    }


    //Called when the shop.html failed to load
    error() {
        $(".content").html("Failed to load content!");
    }
    /**
     * Adds editable input text to every added note
     */
    answerDiagram() {
        let lengte = $('.droparea').length
        for (let i = 1; i <= lengte; i++) {
            let drie = document.querySelector("[data-veld=" + CSS.escape(i + 0) + "]");
            console.log($(drie).data('parentveld'))
            $("<p class='answer' contenteditable='true'>Test</p>").appendTo(drie);
        }

    }


    /**
     * Allows user to add descriptions for every note
     */
    addDescription() {
        console.log($('[id^=row]').length)
        let arr = [];
        let rowCount = $('[id^=row]').length
        for (let i = 1; i <= rowCount; i++) {
            let tekstnum = "#row" + i + " p.beschrijving"
            let tekst = $(tekstnum).text()
            if (i == 1)
                arr.push("{\"text\": \"" + tekst + "\", \"veld\": " + i + "}");
            else
                arr.push(" {\"text\": \"" + tekst + "\", \"veld\": " + i + "}");
        }
        let result = "[" + arr.toString() + "]"
        console.log(result)
        return result;
    }

    /**
     * Saves the answers to an array
     */
    addAnswers() {
        let lengte = $('.droparea').length
        console.log(lengte)
        let array = [];
        for (let i = 1; i <= lengte; i++) {
            let testt = document.querySelector("[data-veld=" + CSS.escape(i) + "]")
            if (i == 1) {
                let veldA = $(testt).find($( "p.answer" ));
                let veldB = veldA.text()
                console.log(veldB)
                array.push("{\"text\": \"" + veldB + "\", \"parent\": \"\"}")

            } else {
                let veldA = $(testt).find($( "p.answer" ));
                let veldB = veldA.text()
                let parentA = $(testt).attr("data-parentveld")
                let parentB = document.querySelector("[data-veld=" + CSS.escape(parentA) + "]")
                let parentC = $(parentB).find($( "p.answer" ));
                let parentD = parentC.text()
                array.push(" {\"text\": \"" + veldB + "\", \"parent\": \"" + parentD + "\"}")

            }

        }
        let result = "[" + array.toString() + "]"
        console.log(result)
        return result;
    }

    /**
     * Allows teacher to put an explanation
     */
    addExplanation(){
        const explanation = document.getElementById("explanation").value
        console.log(explanation)
        return explanation
    }

    /**
     * Adds name to diagram and sends data to database
     */
    async addName() {
        const name = document.getElementById("naam").value
        const insert = await this.diagramManagementRepository.addDiagram(sessionManager.get("userId"), name, this.generateNodeStructure(), this.addAnswers(), this.addDescription(), this.addExplanation())
        alert("Uw diagram is succesvol toegevoegd!")
        app.loadController(CONTROLLER_DIAGRAM, insert.insertId)
    }


    /**
     * Add row to the diagram and insert options
     */
    addRow() {
        let self = this;
        // Find the next row number
        let highestRowNumber = 1;
        this.createDiagramView.find("tbody th").each(function () {
            const rowNumber = parseInt($(this).html());
            if (rowNumber > highestRowNumber) {
                highestRowNumber = rowNumber;

            }
        })

        const nextRowNumber = ++highestRowNumber;

        this.createDiagramView.find("tbody").append(`
            <tr id="row${nextRowNumber}">
                <th scope="row">${nextRowNumber}</th>
                <td><label><select></select></label></td>
                <td><button class="btn btn-danger pt-0 deleteRow">🗑</button></td>
                <td><p class="beschrijving" contenteditable="true">Test</p></td>
            </tr>`);

        this.addSelectOptions();

        $(`#row${nextRowNumber} .deleteRow`).on("click", function () {
            // console.log($(this).parent().parent().prop("id"));
            self.deleteThisRow($(this).parent().parent().prop("id"));
        });
    }

    /**
     * Delete a row from the table and update the number of the other rows
     * @param row to be deleted
     */
    deleteThisRow(row) {
        this.createDiagramView.find(`#${row}`).remove();

        let nextRowNumber = 1;
        this.createDiagramView.find("tbody tr").each(function () {
            $(this).attr("id", `row${nextRowNumber}`);
            $(this).find("th").text(nextRowNumber);
            nextRowNumber++;
        });
    }

    /**
     * Add the options of which every field can be connected to.
     * Every field can only be  connected to fields with a lower number.
     */
    addSelectOptions() {
        let self = this;
        this.createDiagramView.find("select").each(function () {
            const numberOfRows = self.createDiagramView.find("tbody tr").length;
            const currentSelect = $(this);
            currentSelect.empty();
            currentSelect.append(`<option value = null>Kies een veld</option>`)

            const currentRow = parseInt(currentSelect.parent().parent().parent().find("th").html());

            for (let i = 1; i <= numberOfRows; i++) {
                // Exclude current row as option
                if (i < currentRow) {
                    currentSelect.append(`<option value=${i}>Veld ${i}</option>`);
                }
            }
        });
    }


    /**
     * Generate node structure for database
     * @returns {string}
     */
    generateNodeStructure() {
        let self = this;
        if (!this.checkEverythingSelected()) {
            alert("Voor een of meerdere velden moet er nog een veld gekozen worden om aan te koppelen.");
        } else {
            let config = {
                container: "#diagram",
                rootOrientation: "NORTH",
                connectors: {
                    type: "step"
                },
                node: {
                    // Add class 'droparea' to each node
                    HTMLclass: "droparea",
                }
            };

            const diagramStructure = [];
            diagramStructure.push(config)
            self.createDiagramView.find("tbody tr").each(function () {
                const thisRow = $(this);
                const veldNumber = thisRow.find("th").html();
                const parent = thisRow.find("select").children("option:selected").val();

                if (veldNumber === "1") {
                    window["veld" + veldNumber] = {
                        text: {
                            "data-veld": parseInt(veldNumber),
                            "data-parentveld": 0
                        }
                    }
                } else {
                    window["veld" + veldNumber] = {
                        parent: window[["veld" + parent]],
                        text: {
                            "data-veld": parseInt(veldNumber),
                            "data-parentveld": parent
                        }
                    }
                }
                diagramStructure.push(window["veld" + veldNumber])


            });
            const diagramJSON = self.makeJson(diagramStructure);
            return JSON.stringify(diagramJSON.nodeStructure);
        }
    }

    /**
     * Generate the diagram for viewing
     */
    generateDiagram() {
        let self = this;
        if (!this.checkEverythingSelected()) {
            alert("Voor een of meerdere velden moet er nog een veld gekozen worden om aan te koppelen.");
        } else {
            let config = {
                container: "#diagram",
                rootOrientation: "NORTH",
                connectors: {
                    type: "step"
                },
                node: {
                    // Add class 'droparea' to each node
                    HTMLclass: "droparea",
                }
            };


            const diagramStructure = [];
            diagramStructure.push(config)
            self.createDiagramView.find("tbody tr").each(function () {
                const thisRow = $(this);
                const veldNumber = thisRow.find("th").html();
                const parent = thisRow.find("select").children("option:selected").val();

                if (veldNumber === "1") {
                    window["veld" + veldNumber] = {
                        text: {
                            "name": veldNumber,
                            "data-veld": parseInt(veldNumber),
                            "data-parentveld": 0
                        }
                    }
                } else {
                    window["veld" + veldNumber] = {
                        parent: window[["veld" + parent]],
                        text: {
                            "name": veldNumber,
                            "data-veld": parseInt(veldNumber),
                            "data-parentveld": parent
                        }
                    }
                }
                diagramStructure.push(window["veld" + veldNumber])

            });


            const diagramJSON = self.makeJson(diagramStructure);
            new Treant(diagramJSON);
            self.answerDiagram()
        }
    }

    /**
     * Check if every field is connected to another field
     * @returns {boolean}
     */
    checkEverythingSelected() {
        let everythingSelected = true;
        this.createDiagramView.find("select").each(function () {
            if ($(this).children("option:selected").val() === "null") {
                everythingSelected = false;
            }
        });
        return everythingSelected;
    }


// #############################################
// Makes a JSON chart config out of Array config
//
    /** @author -  Author of Treant.js */
// #############################################


    makeJson(configArray) {
        let i = configArray.length, node;

        this.jsonStructure = {
            chart: null,
            nodeStructure: null
        };
        //fist loop: find config, find root;
        while (i--) {
            node = configArray[i];
            if (node.hasOwnProperty('container')) {
                this.jsonStructure.chart = node;
                continue;
            }

            if (!node.hasOwnProperty('parent') && !node.hasOwnProperty('container')) {
                this.jsonStructure.nodeStructure = node;
                node._json_id = 0;
            }
        }

        this.findChildren(configArray);

        return this.jsonStructure;
    }

    findChildren(nodes) {
        let parents = [0]; // start with a a root node

        while (parents.length) {
            let parentId = parents.pop(),
                parent = this.findNode(this.jsonStructure.nodeStructure, parentId),
                i = 0, len = nodes.length,
                children = [];

            for (; i < len; i++) {
                var node = nodes[i];
                if (node.parent && (node.parent._json_id === parentId)) { // skip config and root nodes

                    node._json_id = this.getID();

                    delete node.parent;

                    children.push(node);
                    parents.push(node._json_id);
                }
            }

            if (children.length) {
                parent.children = children;
            }
        }
    }

    findNode(node, nodeId) {
        let childrenLen, found;

        if (node._json_id === nodeId) {
            return node;
        } else if (node.children) {
            childrenLen = node.children.length;
            while (childrenLen--) {
                found = this.findNode(node.children[childrenLen], nodeId);
                if (found) {
                    return found;
                }
            }
        }
    }

    getID() {
        let i = 1;
        return function () {
            return i++;
        };
    }
}
