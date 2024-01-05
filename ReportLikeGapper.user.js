// ==UserScript==
// @name        ReportLikeGapper
// @namespace   Spacebattles
// @description Adds a gap between the Report button and the Like button for very narrow screens and large text sizes
// @match       https://forums.spacebattles.com/threads/*
// @version     0.2
// @icon        https://forums.spacebattles.com/data/svg/2/1/1704166523/2022_favicon_192x192.png
// @author      Mikowmer
// @grant       GM.registerMenuCommand
// @downloadURL https://github.com/Mikowmer/SB-FullQuoter/raw/main/ReportLikeGapper.user.js
// @updateURL   https://github.com/Mikowmer/SB-FullQuoter/raw/main/ReportLikeGapper.user.js
// ==/UserScript==

function postFinder(){
  console.log("ReportLikeGapper v0.2")
  
  let posts_footer = document.getElementsByTagName("footer");
   for (let i = 0; i < posts_footer.length; i += 1){
     let gap = document.createElement("div");
     gap.style.height = "50px";
     let curr_footer = posts_footer[i];
     let curr_actionbar = curr_footer.children[0];
     let curr_actionbar_external = curr_actionbar.children[0]
     curr_actionbar_external.insertAdjacentElement('afterend', gap)
     
     let curr_ratingbar = curr_footer.children[1];
     if (curr_ratingbar.children.length >= 1) {
       let gap = document.createElement("div");
       curr_ratingbar.insertAdjacentElement('afterbegin', gap);
     }
   }
}

postFinder()
