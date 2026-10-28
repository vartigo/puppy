function addPet(){

    let input=document.getElementById("petInput");
    //Find the HTML element whose ID is petInput and store it in input.

    let pet=input.value.trim();

    if(pet===""){
        alert("Please enter a pet name.");
        return;
    }

    let li=document.createElement("li"); //document.createElement("li") creates a new HTML <li> element using JavaScript.


    li.innerHTML=
    pet+
    '<button class="remove" onclick="this.parentElement.remove()">Remove</button>';

    document.getElementById("petList").appendChild(li);

    input.value="";
} 