/**
 * Controller responsible for the events in the diagram view
 */
class LoginDocentController {

    constructor() {
        this.docentRepository = new DocentRepository();

        $.get("views/loginDocent.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());
    }

    setup(data) {

        //Load the login-content into memory
        this.loginView = $(data);

        this.loginView.find("a").on("click", this.handleClickMenuItem);
        this.loginView.find(".login-form").on("submit", (e) => this.handleLogin(e));


        //Empty the content-div and add the resulting view to the page
        $(".content").empty().append(this.loginView);

    }

    handleClickMenuItem() {
        //Get the data-controller from the clicked element (this)
        const controller = $(this).attr("data-controller");

        //Pass the action to a new function for further processing
        app.loadController(CONTROLLER_LOGIN);

        //Return false to prevent reloading the page
        return false;
    }

    async handleLogin(event) {

        //prevent actual submit and page refresh
        event.preventDefault();

        //Find the username and password
        const username = this.loginView.find("[name='username']").val();
        const password = this.loginView.find("[name='password']").val();

        try{
            //await keyword 'stops' code until data is returned - can only be used in async function
            const user = await this.docentRepository.login(username, password);

            sessionManager.set("username", user.username);
            sessionManager.set("type", "docent");
            sessionManager.set("userId", user.id);
            app.loadController(CONTROLLER_WELCOME);

        } catch(e) {
            //if unauthorized error show error to user
            if(e.code === 401) {
                this.loginView
                    .find(".error")
                    .html(e.reason);
            } else {
                console.log(e);
            }
        }
    }

    //Called when the login.html failed to load
    error() {
        $(".content").html("Er is iets fout gegaan! Probeer het opnieuw.");
    }

}

