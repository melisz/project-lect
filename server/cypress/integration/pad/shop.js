describe("Shop", function () {

    beforeEach(function () {
        const session = {"username": "test", "userId": 1, "type": "leerling"};
        localStorage.setItem("session", JSON.stringify(session));

        cy.server();
        cy.route("POST", "/user/getSelectedCursor", JSON.stringify("minecraftSword")).as("minecraftSword");
        cy.route("POST", "/user/getBalance", 5);

        cy.route("POST", "/shop/getBoughtCursors", "fx:boughtCursors.json").as("bought");
        cy.route("POST", "/shop/getAllCursors", "fx:allCursors.json");


        cy.visit("http://localhost:8080/#shop");
    });

    describe('Load cursors', function () {
        beforeEach(function () {
            cy.wait("@minecraftSword");
        })
        it('Load all cursors', function () {
            cy.wait("@bought");
            cy.get(".loading").should('have.css', 'display', 'none');
        });

        it('Show selected cursor', function () {
            cy.get("#minecraftSword").should('have.class', 'current');
        });

        it('Show unlocked cursors', function () {
            cy.get("#purplePacmanGhost").should('have.class', 'unlocked');
            cy.get("#rainbowTail").should('have.class', 'unlocked');
            cy.get("#pizza").should('have.class', 'unlocked');
        });

        it('Show locked cursors', function () {
            cy.get("#mario").should('have.class', 'locked');
        });

        it('Show available cursors', function () {
            cy.get("#squid").should('have.prop', 'className', 'btn  my-3 cursor');
            cy.get("#knuckles").should('have.prop', 'className', 'btn  my-3 cursor');
            cy.get("#fire").should('have.prop', 'className', 'btn  my-3 cursor');
        })
    });

    describe('Click on buttons', function () {
        it('Change to owned cursor', function () {
            cy.server();
            cy.route("POST", "/user/setSelectedCursor", JSON.stringify("pizza"));

            cy.get("#pizza").click();


            cy.get('body').should('have.css', 'cursor', `url("${window.location.origin}/assets/cursors/cur/pizza.cur"), auto`)
        });

        it('Change to default cursor', function () {
            cy.server();
            cy.route("POST", "/user/setSelectedCursor", JSON.stringify("default"));

            cy.get("#default").click();

            cy.get('body').should('have.css', 'cursor', `auto`)
        });

        it('Try to buy locked cursor', function () {

            cy.get("#mario").click();

            cy.get("#swal2-title").should('contain', 'Je hebt niet genoeg punten om deze cursor te kunnen halen');

            cy.get('body').should('have.css', 'cursor', `url("${window.location.origin}/assets/cursors/cur/minecraftSword.cur"), auto`)
        });
        
        it('Buy available cursor', function () {
            cy.server();
            cy.route("POST", "/user/setSelectedCursor", JSON.stringify("squid"));
            cy.route("POST", "/shop/getCursorPrice", 3);
            cy.route("POST", "/shop/buyCursor", {"user": localStorage.getItem("userId"), "cursor": "squid"});
            cy.route("POST", "/user/updateBalance", {"points": -3, "id": localStorage.getItem("userId")});
            cy.get("#squid").click();

            cy.get(".swal2-confirm").click();
            cy.route("POST", "/user/getBalance", 2).as("updatedBalance");

            cy.get("#swal2-title").should('contain', 'Gekocht!');
            cy.get('body').should('have.css', 'cursor', `url("${window.location.origin}/assets/cursors/cur/squid.cur"), auto`)

        });

    });

});