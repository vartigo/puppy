/* =========================================================
   PRACTICAL 7 - VUE JS CUSTOM DIRECTIVES
   ========================================================= */


/* =========================================================
   I. UPPERCASE CUSTOM DIRECTIVE
   ========================================================= */

Vue.directive("uppercase", {

    bind(el) {

        // Show that the text is clickable
        el.style.cursor = "pointer";

        // Convert text to uppercase when clicked
        el.addEventListener("click", function() {

            el.innerText = el.innerText.toUpperCase();

        });

    }

});


/* =========================================================
   II. DYNAMIC PET LIST CUSTOM DIRECTIVE
   ========================================================= */

Vue.directive("pet-list", {

    inserted(el, binding) {

        renderPetList(el, binding.value);

    },

    update(el, binding) {

        renderPetList(el, binding.value);

    }

});


function renderPetList(el, pets) {

    // Remove old list items
    el.innerHTML = "";

    pets.forEach(function(pet) {

        const li = document.createElement("li");

        const text = document.createElement("span");

        text.textContent = pet;

        const button = document.createElement("button");

        button.textContent = "Remove";

        button.className = "remove";

        button.addEventListener("click", function() {

            el.dispatchEvent(
                new CustomEvent("remove-pet", {
                    detail: pet
                })
            );

        });

        li.appendChild(text);

        li.appendChild(button);

        el.appendChild(li);

    });

}


/* =========================================================
   III. DATE FORMATTING CUSTOM DIRECTIVE
   ========================================================= */

Vue.directive("format-date", {

    inserted: function(el, binding) {

        const date = binding.value;

        const formattedDate = formatDate(date);

        el.textContent = formattedDate;

    }

});


function formatDate(dateString) {

    const options = {

        year: "numeric",

        month: "long",

        day: "numeric"

    };

    return new Date(dateString).toLocaleDateString(
        "en-US",
        options
    );

}


/* =========================================================
   MAIN VUE APPLICATION
   ========================================================= */

new Vue({

    el: "#vueApp",

    data: {

        newPet: "",

        wishlist: JSON.parse(
            localStorage.getItem("pets")
        ) || []

    },

    methods: {

        addPet() {

            const pet = this.newPet.trim();

            if (pet === "") {

                alert("Please enter a pet name.");

                return;

            }

            this.wishlist.push(pet);

            this.newPet = "";

            this.savePets();

        },


        removePet(event) {

            const pet = event.detail;

            const index = this.wishlist.indexOf(pet);

            if (index !== -1) {

                this.wishlist.splice(index, 1);

            }

            this.savePets();

        },


        savePets() {

            localStorage.setItem(
                "pets",
                JSON.stringify(this.wishlist)
            );

        }

    }

});

function showInfo() {

    let info = document.getElementById("petInfo");

    if (info.innerHTML === "") {

        info.innerHTML =
            "Maltipoos are friendly, intelligent and playful dogs. " +
            "They are affectionate companions and love spending time " +
            "with their families. Take him home with you today!";

    } else {

        info.innerHTML = "";

    }

}


function getLocation() {

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(showPosition);

    } else {

        document.getElementById("location").innerHTML =
            "Geolocation is not supported.";

    }

}


function showPosition(position) {

    let latitude = position.coords.latitude;

    let longitude = position.coords.longitude;

    document.getElementById("location").innerHTML =
        "Latitude: " + latitude +
        "<br>Longitude: " + longitude;

}


/* =========================================================
   DRAG AND DROP
   ========================================================= */

let cards = document.querySelectorAll(".card");

cards.forEach(function(card) {

    card.addEventListener("dragstart", function(event) {

        event.dataTransfer.setData(
            "text",
            card.outerHTML
        );

    });

});


let dropBox = document.getElementById("dropBox");


dropBox.addEventListener("dragover", function(event) {

    event.preventDefault();

});


dropBox.addEventListener("drop", function(event) {

    event.preventDefault();

    let pet = event.dataTransfer.getData("text");

    dropBox.innerHTML = pet;

});


/* =========================================================
   STUDENT REGISTRATION
   ========================================================= */

document
    .getElementById("registrationForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        alert("Registration successful!");

        let modal = bootstrap.Modal.getInstance(
            document.getElementById("registrationModal")
        );

        modal.hide();

        document
            .getElementById("registrationForm")
            .reset();

    });