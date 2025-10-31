/* 
Author: Merlijn Van Suetendael

This file contains the main JavaScript code used for the FAQ page
*/

"use strict";

/* Event handler for dropdown of the FAQ elements */

let revealableList = document.getElementById("FAQpage_dorpdown_list");
const revealableList_items = revealableList.querySelectorAll("li");

function displayContents(listElement){
    let header = listElement.children[0];
        let contents = listElement.children[1];
        
        if (contents.className == "removeThis") {
            //contents.style.opacity = '0'; -> smooth transition?
            //contents.style.display = 'none';
            contents.className = "";
            
            header.children[0].style.display = 'inline';
            header.children[1].style.display = 'none';
        }
        else{
            //contents.style.display = 'block';
            contents.className = "removeThis";
            
            header.children[0].style.display = 'none';
            header.children[1].style.display = 'inline';
        }
}

/* Event handler for revealing the text in the faq list */

revealableList_items.forEach((item) =>
    item.children[0].addEventListener("click", e => {
        
        let listElement
        if (e.target.nodeName === "DIV") {
            listElement = e.target.parentElement;
        }
        else{
            listElement = e.target.parentElement.parentElement;
        }
        displayContents(listElement);
    }))
