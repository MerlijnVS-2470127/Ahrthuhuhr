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
        
        if (contents.checkVisibility()) {
            contents.style.display = 'none';
            header.children[0].style.display = 'inline';
            header.children[1].style.display = 'none';
        }
        else{
            contents.style.display = 'block';
            header.children[0].style.display = 'none';
            header.children[1].style.display = 'inline';
        }
}

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

/* Event handler for the changing of the icons in the faq list */
