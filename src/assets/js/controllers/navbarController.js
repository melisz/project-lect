/**
 * Responsible for handling the actions happening on sidebar view
 *
 */
class NavbarController {
    constructor() {
        this.userRepository = new UserRepository();
        $.get("views/navbar.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());
    }

    //Called when the navbar.html has been loaded
    setup(data) {
        //Load the sidebar-content into memory
        this.sidebarView = $(data);

        //Find all anchors and register the click-event
        this.sidebarView.find("a").on("click", this.handleClickMenuItem);


        //Empty the sidebar-div and add the resulting view to the page
        $(".sidebar").empty().append(this.sidebarView);

        this.showRightNavbarItems();
        this.setBalance();
    }

    /**
     * Show the right navbar items based on which user is logged in (or not)
     */
    showRightNavbarItems() {
        this.sidebarView.find($('.active').removeClass("active"));
        this.sidebarView.find($('*[data-controller="' + app.getCurrentController() + '"]')).addClass("active");

        if (sessionManager.get("type") === 'leerling') {
            this.sidebarView.find($('*[data-controller="login"]')).hide();
            this.sidebarView.find($('*[data-controller="createDiagram"]')).hide();
            this.sidebarView.find($('*[data-controller="deleteDiagram"]')).hide();
            this.sidebarView.find($('*[data-controller="myClasses"]')).hide();
        } else if (sessionManager.get("type") === 'docent') {
            this.sidebarView.find($('*[data-controller="login"]')).hide();
            this.sidebarView.find($('*[data-controller="shop"]')).hide();
            this.sidebarView.find($('#balance')).hide();
        } else { // Hide all nav items if no one is logged in
            this.sidebarView.find($('.nav-item')).hide();
        }
    }

    async setBalance() {
        if (!sessionManager.get("userId")) {
            $("#points").hide();
        } else if (sessionManager.get("type") === "leerling") {
            const balance = await this.userRepository.getBalance(sessionManager.get("userId"));
            this.sidebarView.find('#point').html(balance);
        }
    }

    handleClickMenuItem() {
        //Get the data-controller from the clicked element (this)
        const controller = $(this).attr("data-controller");

        //Pass the action to a new function for further processing
        app.loadController(controller);

        //Return false to prevent reloading the page
        return false;
    }

    //Called when the login.html failed to load
    error() {
        $(".content").html("Failed to load the sidebar!");
    }

}
