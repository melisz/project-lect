describe("Diagram-list", () => {

    beforeEach(() => {
        //Set user as logged in
        const session = {"username": "test"};
        localStorage.setItem("session", JSON.stringify(session));
        cy.visit("http://localhost:8080/#diagramList");

    });

    it('Load diagrams', () => {
        cy.server();

        cy.route('GET', '/diagram/all*', 'fx:diagramList.json');
        cy.route('POST', '/diagram/getAllProgress', 'fx:progress.json');

        cy.get(".linkToDiagram").should("exist");

    });

    describe('Search bar', function () {
        it('Should exist', function () {
            cy.server();

            cy.route('GET', '/diagram/all*', 'fx:diagramList.json');
            cy.route('POST', '/diagram/getAllProgress', 'fx:progress.json');

            cy.get('#search').should('exist');
        });

        it('Should not show reset button with no input', function () {
            cy.server();

            cy.route('GET', '/diagram/all*', 'fx:diagramList.json');
            cy.route('POST', '/diagram/getAllProgress', 'fx:progress.json');

            cy.get('#resetSearch').should('be.hidden');
        });

        it('Should show reset button with input', function () {
            cy.server();

            cy.route('GET', '/diagram/all*', 'fx:diagramList.json');
            cy.route('POST', '/diagram/getAllProgress', 'fx:progress.json');

            cy.get('#searchBar').type('Test')
            cy.get('#searchButton').click();

            cy.get('#resetSearch').should('not.be.hidden');
        });

        it('Should empty input on reset and hide reset', function () {
            cy.server();

            cy.route('GET', '/diagram/all*', 'fx:diagramList.json');
            cy.route('POST', '/diagram/getAllProgress', 'fx:progress.json');

            cy.get('#searchBar').type('Test')
            cy.get('#searchButton').click();

            cy.get('#resetSearch button').click();

            cy.get('#searchBar').should('be.empty');
            cy.get('#resetSearch').should('be.hidden');
        });


        it('Should show notification on no results', function () {
            cy.server();

            cy.route('GET', '/diagram/all*', 'fx:diagramList.json');
            cy.route('POST', '/diagram/getAllProgress', 'fx:progress.json');

            cy.get('#searchBar').type('Test')
            cy.route('POST', '/diagram/search', []);

            cy.get('#searchButton').click();

            cy.get('.noResults').should('exist').should('contain', 'Er zijn geen resultaten.');
        });


        it('Should show all diagrams on reset', function () {
            cy.server();

            cy.route('GET', '/diagram/all*', 'fx:diagramList.json');
            cy.route('POST', '/diagram/getAllProgress', 'fx:progress.json');

            cy.get('#searchBar').type('Test')
            cy.route('POST', '/diagram/search', [{
                "id": "1",
                "name": "Verbindingen",
                "root_orientation": "NORTH",
                "node_structure": "{\"text\": {\"data-veld\": \"1\", \"data-parentveld\": \"0\"}, \"children\": [{\"text\": {\"data-veld\": \"2\", \"data-parentveld\": \"1\"}, \"children\": [{\"text\": {\"data-veld\": \"4\", \"data-parentveld\": \"2\"}}, {\"text\": {\"data-veld\": \"5\", \"data-parentveld\": \"2\"}}]}, {\"text\": {\"data-veld\": \"3\", \"data-parentveld\": \"1\"}, \"children\": [{\"text\": {\"data-veld\": \"6\", \"data-parentveld\": \"3\"}}, {\"text\": {\"data-veld\": \"7\", \"data-parentveld\": \"3\"}}]}]}",
                "answers": "[{\"text\": \"Verbindingen\", \"parent\": \"\"}, {\"text\": \"Met schroefdraad\", \"parent\": \"Verbindingen\"}, {\"text\": \"Zonder schroefdraad\", \"parent\": \"Verbindingen\"}, {\"text\": \"Schroef\", \"parent\": \"Met schroefdraad\"}, {\"text\": \"Bout\", \"parent\": \"Met schroefdraad\"}, {\"text\": \"Spijker\", \"parent\": \"Zonder schroefdraad\"}, {\"text\": \"Nietje\", \"parent\": \"Zonder schroefdraad\"}]",
                "descriptions": "[{\"text\": \"Alle andere woorden vallen onder deze categorie.\", \"veld\": 1}, {\"text\": \"In welke categorieën kan je verbindingen verdelen?\", \"veld\": 2}, {\"text\": \"In welke categorieën kan je verbindingen verdelen?\", \"veld\": 3}, {\"text\": \"Welke voorwerpen zijn verbindingen?\", \"veld\": 4}, {\"text\": \"Welke voorwerpen zijn verbindingen?\", \"veld\": 5}, {\"text\": \"Welke voorwerpen zijn verbindingen?\", \"veld\": 6}, {\"text\": \"Welke voorwerpen zijn verbindingen?\", \"veld\": 7}]",
                "explanation": "Je kan █ verdelen in verbindingen █ en █. █ en █ horen in de eerste categorie. █ en █ horen in de tweede categorie.\r\n"
            }]);

            cy.get('#searchButton').click();


            cy.route('POST', '/diagram/search', 'fx:diagramList.json');

            cy.get('#resetSearch button').click();

            // Check if it's filled with original data
            for (let i = 1; i <= 3; i++) {
                cy.get('*[data-id= ' + i + ']').within(function () {

                    switch (i) {
                        case 1:
                            cy.get("td").contains("Verbindingen");
                            break;
                        case 2:
                            cy.get("td").contains("Geluid");
                            break;
                        case 3:
                            cy.get("td").contains("Kompas");
                            break;
                    }
                });
            }
        });
    })

    it('Load progress', function () {
        cy.server();

        cy.route('GET', '/diagram/all*', 'fx:diagramList.json');
        cy.route('POST', '/diagram/getAllProgress', 'fx:progress.json');

        for (let i = 1; i <= 3; i++) {
            cy.get('*[data-id= ' + i + ']').within(function () {

                switch (i) {
                    case 1 || 2:
                        cy.get(".text-right").contains("✔");
                        break;
                    case 3:
                        cy.get(".text-right").contains("❌");
                        break;
                }
            });
        }

    });


    it('Link to diagram', function () {
        // Load links
        cy.server();

        cy.route('GET', '/diagram/all*', 'fx:diagramList.json');
        cy.route('POST', '/diagram/getAllProgress', 'fx:progress.json');

        const idDiagram = 1;
        cy.route('POST', '/diagram/withId', {"id": idDiagram}).as("redirect");

        // Catch error from typewriter
        cy.on('uncaught:exception', (err, runnable) => {
            expect(err.message).to.include('something about the error')

            // using mocha's async done callback to finish
            // this test so we prove that an uncaught exception
            // was thrown
            done()

            // return false to prevent the error from
            // failing this test
            return false
        })

        cy.get('[data-id="1"]').click();

        cy.wait("@redirect");

        cy.get("@redirect").should((xhr) => {
            expect(xhr.request.body.id).equals(idDiagram);
        })

        cy.url().should('contain', 'diagram1')
    });

    it('Failed loading diagrams', () => {
        cy.server();

        cy.route({
            method: "GET",
            url: "/diagram/all*",
            response: {"reason": "ERROR"},
            status: 401
        });

        cy.get(".content").should('contain', 'Er is iets fout gegaan!');
    });
});