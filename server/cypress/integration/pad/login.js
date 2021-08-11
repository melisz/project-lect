describe("Login", function () {

    beforeEach(function () {
        cy.visit("http://localhost:8080/#login");
    });

    describe('Get cursor on login', function () {
        // 'Log in' first
        before(function () {
            const session = {"username": "test", "userId": 1, "type": "leerling"};
            localStorage.setItem("session", JSON.stringify(session));

            cy.server();
            cy.route("POST", "/user/getSelectedCursor", JSON.stringify("minecraftSword"));
            cy.route("POST", "/user/getBalance", 5);
        })

        it('Check cursor received', function () {
            cy.get('body').should('have.css', 'cursor', `url("${window.location.origin}/assets/cursors/cur/minecraftSword.cur"), auto`)
        });
    });

});