
function addPet() {

    let input = document.getElementById("petInput");

    let pet = input.value.trim();

    if (pet === "") {

        alert("Please enter a pet name.");

        return;
    }

    let li = document.createElement("li");

    li.innerHTML =
        pet +
        '<button class="remove" onclick="removePet(this)">Remove</button>';

    document.getElementById("petList").appendChild(li);

    input.value = "";

    savePets();
}
function showInfo() {

    let info = document.getElementById("petInfo");

    if (info.innerHTML === "") {

        info.innerHTML =
            "Maltipoos are friendly, intelligent and playful dogs. " +
            "They are affectionate companions and love spending time with their families. Take him home with you today! ";

    } else {

        info.innerHTML = "";

    }

}


function savePets() {

    let pets = [];

    let list = document.querySelectorAll("#petList li");

    list.forEach(function(li) {

        pets.push(li.firstChild.textContent);

    });

    localStorage.setItem("pets", JSON.stringify(pets));
}



function removePet(button) {

    button.parentElement.remove();

    savePets();
}



function loadPets() {

    let pets = JSON.parse(localStorage.getItem("pets")) || [];

    pets.forEach(function(pet) {

        let li = document.createElement("li");

        li.innerHTML =
            pet +
            '<button class="remove" onclick="removePet(this)">Remove</button>';

        document.getElementById("petList").appendChild(li);

    });
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


// Load saved wishlist

loadPets();