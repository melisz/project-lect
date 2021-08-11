/**
 * Entry point front end application - there is also an app.js for the backend (server folder)!
 *
 * Available: `sessionManager` or `networkManager` or `app.loadController(..)`
 *
 * You only want one instance of this class, therefor always use `app`.
 *
 */

const CONTROLLER_LOGIN = "login";
const CONTROLLER_LOGOUT = "logout";
const CONTROLLER_WELCOME = "welcome";
const CONTROLLER_DIAGRAM = "diagram";
const CONTROLLER_DIAGRAM_LIST = "diagramList";
const CONTROLLER_DOCENT = "docent";
const CONTROLLER_SHOP = "shop";
const CONTROLLER_CREATE_DIAGRAM = "createDiagram";
const CONTROLLER_DELETE_DIAGRAM = "deleteDiagram";
const CONTROLLER_MY_CLASSES = "myClasses";
const CONTROLLER_CLASS = "class";

const sessionManager = new SessionManager();
const networkManager = new NetworkManager();

class App {

    init() {

        this.isLoggedIn(async () => {
            if (sessionManager.get("type") === "leerling") {
                this.getCursor();
            }
        }, () => {
        });

        //Attempt to load the controller from the URL, if it fails, fall back to the welcome controller.
        this.loadControllerFromUrl(CONTROLLER_LOGIN);
    }

    /**
     * Loads a controller
     * @param name - name of controller - see constants
     * @param controllerData - data to pass from on controller to another
     * @returns {boolean} - successful controller change
     */
    loadController(name, controllerData) {
        console.log("loadController: " + name);

        if (controllerData) {
            // console.log(controllerData);
        } else {
            controllerData = {};
        }


        this.navbarController = new NavbarController();

        switch (name) {
            case CONTROLLER_LOGIN:
                this.setCurrentController(name);
                this.isLoggedIn(() => new WelcomeController(), () => new LoginController());
                break;

            case CONTROLLER_LOGOUT:
                this.setCurrentController(name);
                this.handleLogout();
                break;

            case CONTROLLER_WELCOME:
                this.setCurrentController(name);
                this.isLoggedIn(() => new WelcomeController, () => new LoginController());
                break;

            case CONTROLLER_DIAGRAM_LIST:
                this.setCurrentController(name);
                this.isLoggedIn(() => new DiagramListController(), () => new new LoginController());
                break;

            case CONTROLLER_DOCENT:
                this.setCurrentController(name);
                this.isLoggedInAsTeacher(() => new WelcomeController(), () => new LoginDocentController());
                break;

            case CONTROLLER_DIAGRAM:
                this.setCurrentController(name + controllerData);
                this.isLoggedIn(() => new DiagramController(controllerData), () => new LoginController());
                break;

            case CONTROLLER_SHOP:
                this.setCurrentController(name);
                this.isLoggedIn(() => new ShopController(), () => new LoginController());
                break;

            case CONTROLLER_CREATE_DIAGRAM:
                this.setCurrentController(name);
                this.isLoggedInAsTeacher(() => new CreateDiagramController(), () => new LoginDocentController());
                break;

            case CONTROLLER_DELETE_DIAGRAM:
                this.setCurrentController(name);
                this.isLoggedIn(() => new DeleteDiagramController(), () => new LoginController());
                break;

            case CONTROLLER_MY_CLASSES:
                this.setCurrentController(name);
                this.isLoggedInAsTeacher(() => new MyClassesController(), () => new LoginDocentController());
                break;

            case CONTROLLER_CLASS:
                this.setCurrentController(name + controllerData);
                this.isLoggedIn(() => new ClassController(controllerData), () => new LoginDocentController());
                break;

            default:
                return false;
        }

        return true;
    }

    /**
     * Alternative way of loading controller by url
     * @param fallbackController
     */
    loadControllerFromUrl(fallbackController) {
        const currentController = this.getCurrentController();

        if (currentController) {
            // Check if the hash contains a diagram with a number
            if (currentController.match(/(diagram)\d+/)) {
                // Set the diagram with the id
                app.loadController(CONTROLLER_DIAGRAM, parseInt(currentController.match(/\d+/)[0]));
            } else if (currentController.match(/(class)\d+/)) {    // Check if the hash contains a diagram with a number
                // Set the diagram with the id
                app.loadController(CONTROLLER_CLASS, parseInt(currentController.match(/\d+/)[0]));
            } else if (!this.loadController(currentController)) {
                this.loadController(fallbackController);
            }
        } else {
            this.loadController(fallbackController);
        }
    }

    getCurrentController() {
        return location.hash.slice(1);
    }

    setCurrentController(name) {
        location.hash = name;
    }

    getNavbar() {
        return this.navbarController;
    }

    async getCursor() {

        // If user is logged in, get last selected cursor from database
        if (sessionManager.get("userId")) {
            try {
                cursor = await new UserRepository().getSelectedCursor(sessionManager.get("userId"));
            } catch (e) { // If cursor can not be retrieved from database, set it to default
                cursor = "default";
                console.log(e);
            }
        } else {
            cursor = "default";
        }

        this.setCursor();
    }

    /**
     * Change the cursor to the selected one
     */
    async setCursor() {
        // Path to the animated cursors (pathToAni) and non-animated cursors (pathToCur)
        let pathToAni = "assets/cursors/ani/";
        let pathToCur = "assets/cursors/cur/";

        // Set the cursor based on the id of the button that is clicked
        switch (cursor) {
            case "runningMan":
                cursorFrames = ['url("http://jantimon.nl/running_man/running_man_1.cur"), auto',
                    'url("http://jantimon.nl/running_man/running_man_2.cur"), auto',
                    'url("http://jantimon.nl/running_man/running_man_3.cur"), auto',
                    'url("http://jantimon.nl/running_man/running_man_4.cur"), auto',
                    'url("http://jantimon.nl/running_man/running_man_5.cur", auto'];
                jiffy = 50;
                break

            case "purplePacmanGhost":
                cursorFrames = ['url("' + pathToAni + 'purplePacmanGhost/1.cur"), auto',
                    'url("' + pathToAni + 'purplePacmanGhost/2.cur"), auto',
                    'url("' + pathToAni + 'purplePacmanGhost/3.cur"), auto'];
                jiffy = 1000 / 60 * 4;
                break

            case "rainbowTail":
                cursorFrames = ['url("' + pathToAni + 'rainbowTail/1.cur"), auto',
                    'url("' + pathToAni + 'rainbowTail/2.cur"), auto',
                    'url("' + pathToAni + 'rainbowTail/3.cur"), auto',
                    'url("' + pathToAni + 'rainbowTail/4.cur"), auto',
                    'url("' + pathToAni + 'rainbowTail/5.cur"), auto',
                    'url("' + pathToAni + 'rainbowTail/6.cur"), auto',
                    'url("' + pathToAni + 'rainbowTail/7.cur"), auto',
                    'url("' + pathToAni + 'rainbowTail/8.cur"), auto',
                    'url("' + pathToAni + 'rainbowTail/9.cur"), auto',
                    'url("' + pathToAni + 'rainbowTail/10.cur"), auto'];
                jiffy = 1000 / 60 * 6
                break

            case "mario":
                cursorFrames = ['url("' + pathToAni + 'mario/1.ico"), auto',
                    'url("' + pathToAni + 'mario/2.ico"), auto',
                    'url("' + pathToAni + 'mario/3.ico"), auto',
                    'url("' + pathToAni + 'mario/4.ico"), auto',
                    'url("' + pathToAni + 'mario/5.ico"), auto',
                    'url("' + pathToAni + 'mario/6.ico"), auto',
                    'url("' + pathToAni + 'mario/7.ico"), auto',
                    'url("' + pathToAni + 'mario/8.ico"), auto'];
                jiffy = 50;
                break

            case "pizza":
                cursorFrames = ['url(" ' + pathToCur + 'pizza.cur"), auto']
                break

            case "minecraftSword":
                cursorFrames = ['url(" ' + pathToCur + 'minecraftSword.cur"), auto']
                break

            case "squid":
                cursorFrames = ['url(" ' + pathToCur + 'squid.cur"), auto']
                break

            case "knuckles":
                cursorFrames = ['url(" ' + pathToCur + 'knuckles.cur"), auto']
                break

            case "fire":
                cursorFrames = ['url(" ' + pathToCur + 'fire.cur"), auto']
                break

            case "default":
                cursorFrames = ['auto'];
                break;
        }

        this.setCursorFrames();
    }

    setCursorFrames() {
        // Reset the process of moving to the next frame
        clearTimeout(moveToNextFrame);
        let numberOfFrame = 0;

        (function cursor() {
            // Set the timing to
            moveToNextFrame = setTimeout(cursor, jiffy);

            $(document.body).css("cursor", cursorFrames[numberOfFrame])

            // Only go through array if it is an animated cursor (which has more than one frames)
            if (cursorFrames.length !== 1) {
                numberOfFrame++;

                // Go back to first frame if at last frame
                if (numberOfFrame === cursorFrames.length) {
                    numberOfFrame = 0;
                }

                // Go to next frame
                moveToNextFrame;
            }
        })();

    }

    /**
     * Convenience functions to handle logged-in states
     * @param whenYes - function to execute when user is logged in
     * @param whenNo - function to execute when user is logged in
     */
    isLoggedIn(whenYes, whenNo) {
        if (sessionManager.get("username")) {
            whenYes();
        } else {
            whenNo();
        }
    }

    /**
     * Convenience functions to handle logged-in states for teachers
     * @param whenYes - function to execute when user is logged in
     * @param whenNo - function to execute when user is logged in
     */
    isLoggedInAsTeacher(whenYes, whenNo) {
        if (sessionManager.get("type") === "docent") {
            whenYes();
        } else {
            whenNo();
        }
    }

    /**
     * Removes username via sessionManager and loads the login screen
     */
    handleLogout() {
        sessionManager.clear();
        this.getCursor();
        //go to login screen
        this.loadController(CONTROLLER_LOGIN);
    }
}

const app = new App();

//When the DOM is ready, kick off our application.
$(function () {
    app.init();
});

// Variable for selected cursor
let cursor;

// The cur(s)/image(s) of the cursor
let cursorFrames;

// Frame rate of animated cursors
let jiffy;

// Timeout to go over the different frames
let moveToNextFrame;

