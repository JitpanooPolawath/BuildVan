let originalContent;
let clickedAbout = false

function aboutClick (){
    console.log("clicking");
    originalContent = document.getElementById("content-text").innerHTML;
    document.getElementById("content-text").textContent="About me is about me, so what do you want to know about me?";
    clickedAbout = true
}
function propertiesClick(){
    if(clickedAbout){
        console.log(originalContent);
        document.getElementById("content-text").innerHTML=originalContent;
    }
    console.log("clicking pro");
}