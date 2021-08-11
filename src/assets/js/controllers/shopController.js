/**
 * Controller responsible for the events in the diagram view
 */
class ShopController {
    constructor() {
        this.shopRepository = new ShopRepository();
        this.userRepository = new UserRepository();
        $.get("views/shop.html")
            .done((data) => this.setup(data))
            .fail(() => this.error());
    }

    //Called when the welcome.html has been loaded
    setup(data) {
        const self = this;
        //Load the welcome-content into memory
        this.shopView = $(data);

        app.getNavbar().setBalance().then(() => self.initializeButtons());

        this.shopView.find(".cursor").on("click", function () {
            self.clickedOnCursor($(this));
        });

        //Empty the content-div and add the resulting view to the page
        $(".content").empty().append(this.shopView);

        // Set top to not let it overlap the navbar
        $(".loading").css("top", $(".sidebar").height());
        $("main").hide();
    }


    //Called when the shop.html failed to load
    error() {
        $(".content").html("Failed to load content!");
    }

    async getBalance() {
        this.balance = await this.userRepository.getBalance(sessionManager.get("userId"));
    }

    /**
     * Initialize the states of the buttons
     *
     */
    async initializeButtons() {
        const self = this;
        const boughtCursors = await this.shopRepository.getBoughtCursors(sessionManager.get("userId"));
        const allCursors = await this.shopRepository.getAllCursors();
        const selectedCursor = await this.userRepository.getSelectedCursor(sessionManager.get("userId"));

        console.log("uyo");
        self.getBalance().then(() => {
            // Set the styling for each cursor
            $(".cursor").each(function () {
                const button = $(this);
                const cursorId = button.prop("id");
                const cursorPrice = allCursors.find(({id}) => id === cursorId).price;
                const cursorHasBeenBought = boughtCursors.find(({cursor_id}) => cursor_id === cursorId);

                // If the cursor has been bought
                if (cursorHasBeenBought) {
                    if (cursorId === selectedCursor) {
                        self.applySelectedCursorStyling(cursorId);
                    } else {
                        button.html('<i class="fas fa-unlock-alt"></i>').addClass("unlocked");
                    }
                } else if (self.balance < cursorPrice) { //  If user does not have enough balance to buy cursor
                    button.html(`<i class="fas fa-lock"></i>`).addClass(("locked"));
                } else if (cursorId !== "default") { // Add the price to the button (except for default cursor)
                    button.html(`<i class="fas fa-coins" style="color: #edff8f"></i> ${cursorPrice}`);
                }
            });

            // Remove loader
            $(".loading").hide();
            $("main").show();
        })

    }


    clickedOnCursor(cursor) {
        const self = this;
        const cursorId = cursor.prop("id");
        if (cursor.hasClass("locked")) {
            swal.fire("Je hebt niet genoeg punten om deze cursor te kunnen halen");

        } else if (cursor.hasClass("unlocked")) {
            this.setCursor(cursorId);
        } else { // Buy cursor
            swal.fire({
                title: 'Deze cursor kopen?',
                imageUrl: cursor.parent().parent().find("img").attr("src"),
                imageWidth: 100,
                imageHeight: 100,
                showCancelButton: true,
                confirmButtonText: 'Kopen!',
                cancelButtonText: 'Annuleren',
                reverseButtons: true
            }).then(async (result) => {
                if (result.value) {
                    const price = await self.shopRepository.getCursorPrice(cursorId);

                    await self.shopRepository.buyCursor(cursorId, sessionManager.get("userId"));
                    await self.userRepository.updateBalance(sessionManager.get("userId"), -price)

                    app.getNavbar().setBalance().then(() => {
                        self.initializeButtons().then(() => {
                            self.setCursor(cursorId)

                            swal.fire(
                                'Gekocht!',
                                `Je hebt nu nog ${$("#point").html()} punten over.`,
                                'success');
                        })
                    });

                }
            })
        }
    }

    /**
     * Find the selected cursor and add text
     */
    async select(selectedCursor) {
        this.applySelectedCursorStyling(selectedCursor);
        await this.userRepository.setSelectedCursor(sessionManager.get("userId"), selectedCursor);
    }

    /**
     * Set the button unlocked
     */
    setCurrentToUnlocked() {
        const currentSelectedCursor = this.shopView.find(".current");

        // Set other text if the selected cursor was the default cursor
        if (currentSelectedCursor.prop("id") === "default") {
            currentSelectedCursor.html("Normale cursor");
        } else {
            currentSelectedCursor.html(`<i class="fas fa-unlock-alt"></i>`).addClass("unlocked");
        }

        currentSelectedCursor.removeClass("current").prop('disabled', false);
    }

    /**
     * Change the cursor
     * @param selectedCursor - the cursor selected by the user
     */
    setCursor(selectedCursor) {
        this.select(selectedCursor).then(() => {
            cursor = selectedCursor;
            app.setCursor();
        });

    }

    applySelectedCursorStyling(selectedCursor) {
        this.setCurrentToUnlocked()
        this.shopView.find("#" + selectedCursor).addClass("current").html("✔");
        this.shopView.find('.current').prop('disabled', true);
    }
}




