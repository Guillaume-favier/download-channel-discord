/**
 * @name download-channel
 * @author yome#3287
 * @description The plugin that let you download the current visible channel or direct Message or group
 * @version 0.0.1
 */




/*
        DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
                    Version 2, December 2004 

 Copyright (C) 2004 Sam Hocevar <sam@hocevar.net> 

 Everyone is permitted to copy and distribute verbatim or modified 
 copies of this license document, and changing it is allowed as long 
 as the name is changed. 

            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION 

  0. You just DO WHAT THE FUCK YOU WANT TO.
*/
const fs = require("fs")
const path = require("path")



const nicePath = (p) => {
	return p.replace(/[/\\?%*:|"<>]/g, '-');
}


module.exports = class ExamplePlugin {
	
	start() {
		// Called when the plugin is activated (including after reloads)
		if (!(fs.existsSync(path.join(__dirname,"conv")))) fs.mkdirSync(path.join(__dirname,"conv"))
		const myButton = document.createElement("button");
		myButton.textContent = "Click me!";
		myButton.id = "DownloadMessage-1"




		let previd = [] // ids of previously downloaded messages
		let messages = [] // the list of downloaded messages


		const dl = () => { // download all loaded messages then load the next ones. return true only if there are no more new messages
			let name = nicePath(document.getElementsByClassName("title-31SJ6t")[0].children[0].children[2].innerText.split("\n").join(" - ")) // get the name of the channel
			let p = path.join(__dirname,"conv",name+".json") // setup the name of the output directory

			let newMessages = []

			let currentMessages = document.querySelectorAll("ol.scrollerInner-2PPAp2 > li");
			let n = 0 // counter of downloaded messages
			let prevAuthor = ""
			for (let i = 0; i < currentMessages.length; i++){ // loop throught all possible messages
				let e = currentMessages[i]
				let id = e.id
				if (previd.includes(id)) break // test if the message is already seen
				previd.push(id)
				n++


				let temp = {
					"author":prevAuthor,
					"time":"",
					"text":"",
					"files":[]
				}

				for(let accessories of e.children[0].children){ // list all parts of a message (text, sender, attached files ...)
					if (accessories.className.startsWith("contents")){
						for(const items of accessories.children){
							if (items.className.startsWith("header")){
								temp["author"] = items.children[0].innerText
								temp["time"] = items.children[1].children[0].getAttribute("datetime")
								prevAuthor = items.children[0].innerText
							}
							else if (items.id.startsWith("message-content")){
								temp["text"] = items.innerText
								const t = items.getElementsByClassName("timestamp-p1Df1m")
								if (t.length == 1){
									temp["time"] = t[0].children[0].getAttribute("datetime")
								}
							}else if (items.className.startsWith("latin24CompactTimeStamp")){
								temp["time"] = items.children[0].getAttribute("datetime")
							}
							
						}
					}
					else if (accessories.id.startsWith("message-accessories")){
						if (accessories.children.length < 1) continue
						for(const acc of accessories.children){
							if (acc.className.startsWith("mediaAttachmentsContainer")){ // videos or images
								for(const med of acc.children[0].children){
									if (med.children[0].className.startsWith("imageWrapper") || med.children[0].children[0].className.startsWith("imageWrapper")){ // videos
										let meta = med.children[0].children[0].children[0]
										if (meta.className.startsWith("wrapperPaused")) meta = meta.children[0]
										const l = meta.src.split("/")
										temp["files"].push({
											"type":"video",
											"name": l[l.length-1],
											"link":meta.src
										})
									}else if (med.children[0].className.startsWith("imageContent")){ // images
										let meta = med.children[0].children[0].children[0].children[0]
										const l = meta.href.split("/")
										temp["files"].push({
											"type":"image",
											"name": l[l.length-1],
											"link": meta.href
										})
									}
								}
							}
							if (acc.className.startsWith("nonMediaAttachmentsContainer")){ // files or music
								for(const media of acc.children){
									let tempFile = {}
									let a = media.children[0].children[0].children[1].children[0].children[0]
									if (media.children[0].children[0].children[1].className.startsWith("text")){ // download text files
										const meta = media.children[0].children[0].children[1]
										tempFile = {
											"type":"text",
											"title":meta.getElementsByClassName("downloadSection-20OayS attachmentName-vgRpzs")[0].innerText,
											"link": meta.getElementsByTagName("a")[0].href,
											"size": meta.getElementsByClassName("downloadSection-20OayS formattedSize-1YbZww")[0].innerText
										}
									}
									else if(media.children[0].children[0].className.startsWith("wrapperAudio")){// audio file
										const meta = media.children[0].children[0].children[0].children[0]
										tempFile = {
											"type":"audio",
											"title":meta.children[0].innerText,
											"link": meta.children[0].href,
											"size": meta.children[1].innerText
										}
									}else{
										const meta = media.children[0].children[0].children[1]
										tempFile = {
											"type":"other",
											"title":meta.children[0].children[0].innerText,
											"link": meta.children[0].children[0].href,
											"size": meta.children[1].innerText
										}
									}
									// console.log("file or audio :",media.children[0].children[0])
									temp["files"].push(tempFile)
								}
								
							}
						}
					}
				}
				newMessages.push(temp)
			}
			if (n == 0) return true // no more new messages
			messages = newMessages.concat(messages)
			console.log(newMessages)
			fs.writeFileSync(p,JSON.stringify({ messages},null,2)) // write the messages to the right file
			currentMessages[0].scrollIntoView() // scroll to the top to load older messages
			return false
		}

		const vdl = async() => { // call the function dl() every 2s until it reach the top of the start of the channel
			BdApi.alert("Warning", "You are about to download this channel, please don't switch channel and don't close the window but you can let discord running in the background");

			let j = 0
			while (dl() == false) {
				j++
				await new Promise(r => setTimeout(r, 2000));
			}
			BdApi.alert("Complete", "Messages Downloaded");
		}

		myButton.addEventListener("click", vdl);

		const serverList = document.querySelector(".buttons-uaqb-5");
		serverList.prepend(myButton);
	}

	

	stop() {
		// Called when the plugin is deactivated
		let t = document.getElementById("DownloadMessage-1")
		if (t) t.remove()
	}
};
