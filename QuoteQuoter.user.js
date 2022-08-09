// ==UserScript==
// @name        QuoteQuoter
// @namespace   Spacebattles
// @description Allows you to quote posts while including any pre-existing quotes.
// @match       https://forums.spacebattles.com/*
// @version     0.1
// @icon        https://forums.spacebattles.com/android-chrome-192x192.png
// @author      Mikowmer
// @grant       GM.info
// @grant       GM.setValue
// @grant       GM.getValue
// @grant       GM.registerMenuCommand
// @downloadURL https://github.com/Mikowmer/SB-FullQuoter/raw/main/QuoteQuoter.user.js
// @updateURL   https://github.com/Mikowmer/SB-FullQuoter/raw/main/QuoteQuoter.user.js
// ==/UserScript==

function bbEncode (post_content) {
    // Dealing with <blockquote>
    let blockquotes = post_content.getElementsByTagName("blockquote");
	let blockquotes_originals = [];
    for (let i = 0; i < blockquotes.length; i++) {
		blockquotes_originals[i] = blockquotes[i].innerHTML;
        blockquotes[i].innerHTML = blockquotes[i].getElementsByClassName("bbCodeBlock-expandContent")[0].innerHTML.trim();
    }

	// Dealing with Spoilers
	let spoilers = post_content.getElementsByClassName("bbCodeSpoiler");
	let spoilers_originals = [];
	for (let i = 0; i < spoilers.length; i++) {
		spoilers_originals[i] = spoilers[i].innerHTML;
		let spoiler_title = ""
		try {
			spoiler_title = spoilers[i].getElementsByClassName("bbCodeSpoiler-button-title")[0].innerHTML;
		}
		catch(err) {
			if (err.name !== "TypeError") {
				throw err;
			}
		}
		spoilers[i].setAttribute("data-spoiler-title",  spoiler_title);
		spoilers[i].innerHTML = bbEncode(spoilers[i].getElementsByClassName("bbCodeBlock-content")[0]);
	}

	// Extract HTML
    let html = post_content.innerHTML;

	// Reset Page
	for (let i = 0; i < blockquotes.length; i++) {
		blockquotes[i].innerHTML = blockquotes_originals[i];
	}
	for (let i = 0; i < spoilers.length; i++) {
		spoilers[i].innerHTML = spoilers_originals[i]
		spoilers[i].removeAttribute("data-spoiler-title")
	}

	html = html.replace(/<blockquote data-attributes="member: (.*?)" data-quote="(.*?)" data-source="post: (.*?)" (.*?)>/gmi, "[QUOTE=\"$2, post: $3, member: $1\"]\n");
	html = html.replace(/<\/blockquote>/gi, "[\/QUOTE]\n");

	html = html.replaceAll(/<div class="bbCodeSpoiler" data-spoiler-title=(.*?)>(.*?)<\/div>/gmis, "\n[SPOILER=$1]$2[/SPOILER]\n")

	// Remainder of this is copied from https://gist.github.com/soyuka/6183947
	html = html.replace(/<pre(.*?)>(.*?)<\/pre>/gmi, "[code]$2[/code]");

	html = html.replace(/<hr class="bbc-hr bbc-hr--(.*?)">/gi, "\n[HR=$1][\/HR]\n")

	html = html.replace(/<h[1-7](.*?)>(.*?)<\/h[1-7]>/, "\n[h]$2[/h]\n");

	//paragraph handling:
	//- if a paragraph opens on the same line as another one closes, insert an extra blank line
	//- opening tag becomes two line breaks
	//- closing tags are just removed
	// html += html.replace(/<\/p><p/<\/p>\n<p/gi;
	// html += html.replace(/<p[^>]*>/\n\n/gi;
	// html += html.replace(/<\/p>//gi;

	html = html.replace(/<br(.*?)><br(.*?)>/gi, "\n");
	html = html.replace(/\n<br(.*?)>\n/gi, "\n");
	html = html.replace(/<br(.*?)>/gi, "\n");
	html = html.replace(/<textarea(.*?)>(.*?)<\/textarea>/gmi, "\[code]$2\[\/code]");
	html = html.replace(/<b>/gi, "[b]");
	html = html.replace(/<i>/gi, "[i]");
	html = html.replace(/<u>/gi, "[u]");
	html = html.replace(/<\/b>/gi, "[/b]");
	html = html.replace(/<\/i>/gi, "[/i]");
	html = html.replace(/<\/u>/gi, "[/u]");
	html = html.replace(/<em>/gi, "[b]");
	html = html.replace(/<\/em>/gi, "[/b]");
	html = html.replace(/<strong>/gi, "[b]");
	html = html.replace(/<\/strong>/gi, "[/b]");
	html = html.replace(/<cite>/gi, "[i]");
	html = html.replace(/<\/cite>/gi, "[/i]");
	html = html.replace(/<font color="(.*?)">(.*?)<\/font>/gmi, "[color=$1]$2[/color]");
	html = html.replace(/<font color=(.*?)>(.*?)<\/font>/gmi, "[color=$1]$2[/color]");
	html = html.replace(/<link(.*?)>/gi, "");
	html = html.replace(/<li(.*?)>(.*?)<\/li>/gi, "[*]$2");
	html = html.replace(/<ul(.*?)>/gi, "[list]");
	html = html.replace(/<\/ul>/gi, "[/list]");
	html = html.replace(/<div>/gi, "\n");
	html = html.replace(/<\/div>/gi, "\n");
	html = html.replace(/<td(.*?)>/gi, " ");
	html = html.replace(/<tr(.*?)>/gi, "\n");

	html = html.replace(/<img(.*?)src="(.*?)"(.*?)>/gi, "[img]$2[/img]");
	html = html.replace(/<a(.*?)href="(.*?)"(.*?)>(.*?)<\/a>/gi, "[url=$2]$4[/url]");

	html = html.replace(/<head>(.*?)<\/head>/gmi, "");
	html = html.replace(/<object>(.*?)<\/object>/gmi, "");
	html = html.replace(/<script(.*?)>(.*?)<\/script>/gmi, "");
	html = html.replace(/<style(.*?)>(.*?)<\/style>/gmi, "");
	html = html.replace(/<title>(.*?)<\/title>/gmi, "");
	html = html.replace(/<!--(.*?)-->/gmi, "\n");

	html = html.replace(/\/\//gi, "/");
	html = html.replace(/http:\//gi, "http://");

	html = html.replace(/<(?:[^>'"]*|(['"]).*?\1)*>/gmi, "");
	html = html.replace(/\r\r/gi, "");
	html = html.replace(/\[img]\//gi, "[img]");
	html = html.replace(/\[url=\//gi, "[url=");

	html = html.replace(/(\S)\n/gi, "$1 ");

	return html;
}


function FullQuoteButton (event) {
    const post_id = event.currentTarget.dataset.postId;
    const post_content = document.getElementById("js-post-" + post_id.toString())
        .getElementsByTagName("article")[0]
        .getElementsByClassName("bbWrapper")[0];
    navigator.clipboard.writeText(bbEncode(post_content));
	alert("Copied Post to Clipboard")
    // console.log(event)
}


function init_button(){
    let posts = document.getElementsByTagName("article");
    for (let i = 0; i < posts.length; i += 2){
        let curr_post = posts[i];
        let curr_post_id = curr_post.dataset.content.slice(5);
        let curr_author = curr_post.dataset.author;

        let curr_author_id = curr_post.getElementsByClassName("username")[0].dataset.userId;

        let curr_post_actionBar_internal = curr_post.getElementsByClassName("actionBar-set--internal")[0];
        let curr_post_menuTrigger = curr_post_actionBar_internal.getElementsByClassName("actionBar-action--menuTrigger")[0]

        const whitespaceNode = document.createTextNode("\n" +
            "\t\t\t\n");
        const buttonNode = document.createElement("button");
        const textNode = document.createTextNode("Full Quote");
        buttonNode.appendChild(textNode);
        const quote_id = "quoter_" + curr_post_id.toString()
        buttonNode.setAttribute("id", quote_id);
        buttonNode.setAttribute("data-post-id", curr_post_id);
        buttonNode.setAttribute("data-author", curr_author);
        buttonNode.setAttribute("data-author-id", curr_author_id);

        curr_post_actionBar_internal.insertBefore(whitespaceNode, curr_post_menuTrigger);
        curr_post_actionBar_internal.insertBefore(buttonNode, curr_post_menuTrigger);

        document.getElementById (quote_id).addEventListener ("click", FullQuoteButton, false);


        console.log([curr_post_id, curr_author, curr_post_actionBar_internal, curr_author_id]);
    }
    console.log(posts);
}


function main(){
    console.log("Hello World!");
}

GM.registerMenuCommand("Hello World!", main, "H");
init_button();
