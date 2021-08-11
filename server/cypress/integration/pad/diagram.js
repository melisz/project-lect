describe("Diagram", function () {

    beforeEach(function () {
        //Set user as logged in
        const session = {"username": "test", "type": "leerling", "userId": 1};
        localStorage.setItem("session", JSON.stringify(session));
        cy.visit("http://localhost:8080/#diagram1");

    });

    const idUser = 2;
    const idDiagram = 1;

    describe('Loading the diagram', function () {
        it('Load diagram', function () {
            cy.server();

            cy.route('POST', '/diagram/withId', 'fx:diagram.json');

            cy.get("#diagram").get("svg").should('exist');
            cy.get("#diagram").get(".node").should('exist');

            cy.get("#listOfWords").get(".item").should('exist');

        });

        it('Failed loading diagram', function () {
            cy.server();

            cy.route({
                method: "POST",
                url: "/diagram/withId",
                response: {"reason": "ERROR"},
                status: 401
            });

            cy.get(".content").should('contain', 'Er is iets fout gegaan');
        });
    });

    describe("Diagram functionality", function () {
        beforeEach(function () {
            cy.server();
            cy.route('POST', '/user/getBalance', {"balance": 0});
            cy.route('POST', '/diagram/withId', 'fx:diagram.json');
        });

        it('Get progress and notification', function () {
            cy.route('POST', '/diagram/getProgress', [{"completed": 1}]);

            cy.get(".swal2-container").should('exist');
        });

        it('Get progress and no notification', function () {
            cy.route('POST', '/diagram/getProgress', [{"completed": 0}]);

            cy.get(".swal2-container").should('not.exist');
        });


        it('Set progress', function () {

            cy.route('POST', '/user/updateBalance', {"id": idUser, "points": 4});

            cy.route('POST', '/diagram/setProgress', {"user": idUser, "diagram": idDiagram}).as("redirect");
            placeWords(2, 3, 4);

            cy.get(".swal2-confirm").click();

            cy.wait("@redirect");

            cy.get("@redirect").should((xhr) => {
                console.log(xhr);
                expect(xhr.response.body.user).equals(idUser);
                expect(xhr.response.body.diagram).equals(idDiagram);
            })

        });

        it('Correct descriptions', function () {
            for (let i = 1; i <= 4; i++) {
                cy.get('*[data-veld= ' + i + ']').click();
                cy.get("#opdrachtomschrijving").contains(new RegExp(`Hier komt de beschrijving voor veld ${i}.`))
            }
        });


        const GREEN = 'rgb(0, 128, 0)';
        const RED = 'rgb(255, 0, 0)';

        describe("Check answers", function () {

            it('Wrong answers', function () {

                placeWords(3, 2, 4);

                cy.get("#woord1").should('have.css', 'border-color', GREEN);
                cy.get("#woord2").should('have.css', 'border-color', RED);
                cy.get("#woord3").should('have.css', 'border-color', RED);
                cy.get("#woord4").should('have.css', 'border-color', RED);

            });

            it('Correct answers', function () {

                placeWords(2, 3, 4);

                cy.get("#woord1").should('have.css', 'border-color', GREEN);
                cy.get("#woord2").should('have.css', 'border-color', GREEN);
                cy.get("#woord3").should('have.css', 'border-color', GREEN);
                cy.get("#woord4").should('have.css', 'border-color', GREEN);
            });
        });

        describe("Check explanations", function () {
            it('Check explanation with wrong answers', function () {

                placeWords(3, 2, 4);

                cy.get("#swal2-content").within(() => {
                    // Check if the text is correct
                    cy.get("p").should("have.text", 'In het eerste veld hoort woord 1 te staan. ' +
                        'In het tweede veld hoort woord 3 te staan. Daaronder staan woord 2 en woord 4. ' +
                        'Woord 3 heeft dus twee "kinderen".');

                    // Check if the words have the right colors
                    cy.get("p").within(() => {
                        cy.get("span:nth-child(1)").should("have.css", "color", GREEN);
                        cy.get("span:nth-child(2)").should("have.css", "color", RED);
                        cy.get("span:nth-child(3)").should("have.css", "color", RED);
                        cy.get("span:nth-child(4)").should("have.css", "color", RED);
                    });
                })
            });

            it('Check explanation with right answers', function () {

                cy.route('POST', '/user/updateBalance', {"id": idUser, "points": 4});


                placeWords(2, 3, 4);

                cy.get(".swal2-confirm").click();

                cy.get("#swal2-content").should("have.text", 'In het eerste veld hoort woord 1 te staan. ' +
                    'In het tweede veld hoort woord 2 te staan. Daaronder staan woord 3 en woord 4. ' +
                    'Woord 2 heeft dus twee "kinderen".');

                // Check if the words have the right colors
                cy.get("#swal2-content").within(() => {
                    cy.get("span:nth-child(1)").should("have.css", "color", GREEN);
                    cy.get("span:nth-child(2)").should("have.css", "color", GREEN);
                    cy.get("span:nth-child(3)").should("have.css", "color", GREEN);
                    cy.get("span:nth-child(4)").should("have.css", "color", GREEN);
                });

            });
        });
    });

    describe("Check balance", function () {
        it('Balance at loading', function () {
            cy.server();
            cy.route('POST', '/user/getBalance', 3);
            cy.route('POST', '/diagram/getProgress', [{"completed": 0}]);
            cy.route('POST', '/diagram/withId', 'fx:diagram.json');

            cy.get("#point").should('contain', 3)
        });

        it('Balance before completing diagram once', function () {
            cy.server();
            cy.route('POST', '/diagram/getProgress', [{"completed": 0}]);
            // Set balance to 0
            cy.route('POST', '/user/getBalance', 0).as("firstBalance");
            cy.wait("@firstBalance")

            cy.route('POST', '/diagram/withId', 'fx:diagram.json');


            cy.route('POST', '/user/updateBalance', {}).as("updateBalance");
            // Set balance to 4
            cy.route('POST', '/user/getBalance', 4).as("secondBalance");
            cy.route('POST', '/diagram/setProgress', {}).as("updateProgress")

            placeWords(2, 3, 4);
            cy.wait("@updateBalance")

            cy.wait("@updateProgress")
            cy.get("@updateBalance").should((xhr) => {
                console.log(xhr);
                expect(xhr.request.body.points).equals(4);
                expect(xhr.request.body.id).equals(1);

            })
            // Check if balance is 4
            cy.get("#point").should('contain', 4)
        });

        it('Balance after completing diagram once', function () {
            cy.server();
            cy.route('POST', '/diagram/getProgress', [{"completed": 1}]);
            // Set balance to 4
            cy.route('POST', '/user/getBalance', 4).as("firstBalance");
            cy.route('POST', '/diagram/withId', 'fx:diagram.json');

            placeWords(2, 3, 4);

            // Check if balance is still 4
            cy.get("#point").should('contain', 4)
        });
    })
});

function placeWords(place2ndWord, place3rdWord, place4thWord) {
    cy.get("#woord2").then((element) => {
        const woord2 = element;

        cy.get("#woord3").then((element) => {
            const woord3 = element;

            cy.get("#woord4").then((element) => {
                const woord4 = element;

                Cypress.$('*[data-veld=' + place2ndWord + ']').append(woord2);
                Cypress.$('*[data-veld=' + place3rdWord + ']').append(woord3);
                Cypress.$('*[data-veld=' + place4thWord + ']').append(woord4);


                cy.get("#getResult").click();
            });
        });
    });
}