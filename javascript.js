
// document.querySelector("h1").style.color = "red";

//     // Variable pour vérifier si l'utilisateur est un super utilisateur
//     const isSuperUser = true; // Changez cette valeur à `false` pour tester un utilisateur non autorisé

//     // Fonction pour remplacer une photo
//     function replacePhoto(photoName) {
//         if (!isSuperUser) {
//             alert("Seul le super utilisateur peut modifier les photos.");
//             return;
//         }
//         const newPhoto = prompt("Entrez l'URL de la nouvelle photo :");
//         if (newPhoto) {
//             const imgElement = document.querySelector(`img[src="images/${photoName}"]`);
//             if (imgElement) {
//                 imgElement.src = newPhoto;
//             }
//         }
//     }

//     // Fonction pour supprimer une photo
//     function deletePhoto(button) {
//         if (!isSuperUser) {
//             alert("Seul le super utilisateur peut supprimer les photos.");
//             return;
//         }
//         const container = button.closest('.container');
//         const imgElement = container.querySelector('img');
//         if (imgElement) {
//             imgElement.remove();
//         }
//     }
/* <script> */

const keypresscontainer = document.querySelector(".keypress");
const key = document.getElementById("key");

document.addEventListener("keypress", () => {
    console.log("salut");
})

document.addEventListener("keypress", (e) => {
    key.textContent = e.key;
    console.log(e.key);
})



    const ring= ( )=> {
    const audio = new Audio();
    audio.src = "./enter.mp3";
    audio.play();
}
document.addEventListener("keypress", (e) => {
    key .textContent = e.key;
    if (e.key === "Enter") {
        ring();
    }

})



// </script>