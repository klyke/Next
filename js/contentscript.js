$(document).ready(function(){
	start();
});

var videoList = [];
var videoObjList = [];
var saveList = [];
var saveObjList = [];
var autoToggle = false;
var droppedOnQ = false;

function start(){
	appendSidebar();
	injectVideoWatcher();
}

function makeVideoObj(title, thumbUrl, id){
	var videoObj = new Object();
	videoObj.title = title;
	videoObj.thumbUrl = thumbUrl;
	videoObj.id = id;
	videoObjList.push(videoObj);
}

function storeVideoObjs(videoObj){
	var assocArray = {};
	for(var i = 0; i<videoObjList.length; i++){
		assocArray[i] = videoObjList[i]
	}
	sessionStorage.setItem("videoList", JSON.stringify(assocArray));
}

function getVideoIds(){
	tempList = [];
	try{
		var temp = JSON.parse(sessionStorage.getItem("videoList"));
		var len = 0;
		if(temp!=null){
			for(var key in temp){
				if(temp.hasOwnProperty(key)){
					len++;
				}
			}
			for(var i = 0; i<len; i++){
				tempList.push(temp[i].id);
				videoObjList.push(temp[i]);
			}
			videoList = tempList.slice();
			populateSidebar();

		}
	}catch(e){
		console.log("Error retrieving videos: " + e);
	}
}

function populateSidebar(){
	for(var i = 0; i<videoObjList.length; i++){
		var vidObj = videoObjList[i];
		console.log(i + ": " + vidObj.title);
		var div = makeVideoDiv(vidObj.title, vidObj.thumbUrl, vidObj.id, false);
		addDivToSidebar(div);
	}
}

function appendSidebar(){
	var extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
	if (!location.ancestorOrigins.contains(extensionOrigin)) {
		var div = document.createElement('div');
		div.id = "qSidebar";
		div.style.cssText = "\
		position: fixed;\
		float: bottom;\
		bottom:0px;\
		width:100%;\
		height:140px;\
		display: block;\
		background-color:rgba(0,0,0,0.7);\
		color:white;\
		z-index:2000000000;\
		box-shadow: rgb(181, 181, 181) 1px 0px 3px 3px;\
		";

		document.body.appendChild(div);
		$.get(chrome.extension.getURL('qSideBar.html'), function(data) {
			$(data).appendTo('#qSidebar');
		});
		$("#qSidebar").hide();
		setTimeout(function(){
			getVideoIds();
			addListeners();
			$("#qVideoHolder").sortable({
				update: function(){
					updatePlayOrder();
				},
				start: function(event, ui) {
					ui.item.bind("click.prevent",
						function(event) { event.preventDefault(); });
				},
				stop: function(event, ui) {
					setTimeout(function(){ui.item.unbind("click.prevent");}, 300);
				}
			});
		}, 2000);
		
	}
}


function addListeners(){
	var down = document.getElementById("down");
	var clear = document.getElementById("clear");
	var shuffle = document.getElementById("shuffle");
	var list = document.getElementById("qVideoHolder");
	var holder = document.getElementById("masterDiv");
	var images = document.getElementsByTagName("img");

	down.addEventListener('click', function(){
		toggleSidebar();
	});

	clear.addEventListener('click', function(){
		if(clear.className == "myIcon fa fa-trash-o" && videoList.length >= 1){
			var qList = document.getElementById("qVideoHolder");
			while (qList.firstChild) {
				qList.removeChild(qList.firstChild);
			}
			saveList = videoList.slice();
			saveObjList = videoObjList.slice();
			videoList = [];
			videoObjList = [];
			storeVideoObjs();
			addNoVideosText();
			clear.className = "myIcon fa fa-undo";
		}
		else if(clear.className == "myIcon fa fa-undo"){
			clear.className = "myIcon fa fa-trash-o";
			videoList = saveList.slice();
			videoObjList = saveObjList.slice();
			storeVideoObjs();
			populateSidebar();
		}
	});
	
	shuffle.addEventListener("click", function(){
		var ul = document.getElementById("qVideoHolder");
		if(ul.children.length > 1){
			for (var i = ul.children.length; i >= 0; i--) {
				ul.appendChild(ul.children[Math.random() * i | 0]);
			}
			updatePlayOrder();
		}
	});

	holder.addEventListener("dragover", function(){
		event.preventDefault();
	});

	holder.addEventListener("drop", drop, false);

	document.addEventListener("dragstart", function(event){
		var itemData = event.dataTransfer.getData("text/html");
		if($(itemData).attr("src")){
			if($(itemData).attr("src").split(".")[1] == "ytimg"){
				dragStartToggle();
			}
		}else if($(itemData).attr("href")){
			if($(itemData).attr("href").indexOf("/watch?v=") > -1){
				dragStartToggle();
			}
		}
	})

	document.addEventListener("dragend", function(){
		if(!droppedOnQ && autoToggle) {
			toggleSidebarSlow();
			droppedOnQ = false;
			autoToggle = false;
		}
	});
}

function copy(list){
	var newList = [];
	for(var i = 0; i<list.length; i++){
		newList.push(list[i]);
	}
	return newList;
}

function drop(e){
	e.stopPropagation();
    e.preventDefault(); 
    var itemData = e.dataTransfer.getData('text/html');
    droppedOnQ = true;
    if($(itemData).attr('src')){
    	try{
	    	var url = $(itemData).attr('src');
	    	getIdFromImage(url)
    	} catch(e){
    		console.log("Could not find video url");
    	}
    }
    else if($(itemData).attr("href")){
    	try{
    		var url = $(itemData).attr("href");
    		getVideoId(url);
    	} catch(ex){
    		console.log("Could not find video url");
    	}
    }
}

function getIdFromImage(url){
	try{
		var id = url.split("/")[4];
		addVideoFromId(id);
	} catch(e){
		console.log("Could not find video id");
	}
}


function updatePlayOrder(){
	tempList = [];
	tempObjList = [];
	var ul = document.getElementById("qVideoHolder");
	for(var i = 0; i<ul.children.length; i++){
		tempList.push(ul.children[i].getAttribute("vidId"));
	}
	videoList = tempList.slice();
	for(var j = 0; j<videoList.length; j++){
		for(var k = 0; k<videoObjList.length; k++){
			var vidObj = videoObjList[k];
			if(vidObj.id == videoList[j]){
				tempObjList.push(vidObj);
				break;
			}
		}
	}
	videoObjList = tempObjList.slice();
	storeVideoObjs();
}

function toggleSidebar(){
	$("#qSidebar").slideToggle('fast');
}

function toggleSidebarSlow(){
	$("#qSidebar").slideToggle('slow');
}

function dragStartToggle(){
	droppedOnQ = false;
	if(!$("#qSidebar").is(":visible")){
		autoToggle = true;
		toggleSidebar();
	}
}

function alertVideoEnded(){
	if(videoList.length > 0){
		var nextVideo = videoList.shift();
		removeObjById(nextVideo);
		storeVideoObjs();
		chrome.runtime.sendMessage({state: "videoDone", newVideo: nextVideo});
	}else{
		chrome.runtime.sendMessage({state:"no videos"});
	}
}

function addNoVideosText(){
	var qSidebar = document;
	var masterDiv = qSidebar.getElementById("masterDiv");
	var test = qSidebar.getElementById("noVideosText");
	if(!test){
		var h = document.createElement('h4');
		h.id = "noVideosText";
		var text = document.createTextNode("Drag a video here to get started!");
		h.appendChild(text);
		masterDiv.appendChild(h);
	}
}

function removeNoVideosText(){
	var noVideosText = document.getElementById("noVideosText");
	if(noVideosText){
		noVideosText.parentNode.removeChild(noVideosText);
	}
}

function removeFromList(id){
	var i = videoList.indexOf(id);
	if(i > -1){
		videoList.splice(i,1);
	}
	removeObjById(id);
	storeVideoObjs();
	if(videoList.length == 0){
		addNoVideosText();
	}
}

function removeObjById(id){
	for(var j = 0; j<videoObjList.length; j++){
		if(videoObjList[j].id == id){
			videoObjList.splice(j,1)
			break;
		}
	}
}

function makeVideoDiv(title, thumbnail, id, isNew){
	var li = document.createElement("li");
	li.setAttribute("vidId", id);
	li.setAttribute("draggable", "true");

	var cueItem = document.createElement("div");
	cueItem.className = "cueItem";
	cueItem.id = "contentHolder";
	cueItem.setAttribute("vidId", id);

	var closeHolder = document.createElement('span');
	closeHolder.className = "closeHolder";

	var closeIcon = document.createElement('img');
	closeIcon.src = chrome.extension.getURL("./close.png");
	closeIcon.className = "closeIcon";
	closeIcon.setAttribute("vidId", id);
	closeIcon.addEventListener("click", function(){
		this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);
		removeFromList(this.getAttribute("vidId"));
	});

	closeHolder.appendChild(closeIcon);

	var cueInfo = document.createElement('div');
	cueInfo.className = ("cueInfo");
	cueInfo.setAttribute("vidId", id);

	var thumb = document.createElement("img");
	thumb.id = "thumb";
	thumb.src = thumbnail;

	var thumbTitle = document.createElement("p");
	thumbTitle.id = "thumbTitle";

	var titleNode = document.createTextNode(title);
	thumbTitle.appendChild(titleNode);

	cueInfo.appendChild(thumb);
	cueInfo.appendChild(thumbTitle);

	cueInfo.addEventListener("click", function(){
		playThisVideo(this.getAttribute("vidId"));
	});

	cueItem.appendChild(closeHolder);
	cueItem.appendChild(cueInfo);
	li.appendChild(cueItem);

	if(isNew) makeVideoObj(title, thumbnail, id);

	return li;
}


function playThisVideo(id){
	removeFromList(id);
	chrome.runtime.sendMessage({state: "videoDone", newVideo: id});
}


function addVideoToQ(title, id){
	var undoButton = document.getElementById("clear");
	removeNoVideosText();
	if(undoButton.className == "myIcon fa fa-undo"){
		undoButton.className = "myIcon fa fa-trash-o";
		saveList = [];
		saveObjList = [];
	}
	var thumbUrl = "https://img.youtube.com/vi/" + id + "/default.jpg";
	
	var newItem = makeVideoDiv(title, thumbUrl, id, true);
	addDivToSidebar(newItem);

}

function addDivToSidebar(newItem){
	removeNoVideosText();
	try{
	var qList = document.getElementById("qVideoHolder");
	qList.appendChild(newItem);
	console.log("appended");

	$(newItem).ready(function(){
		$(newItem.querySelector("#contentHolder")).animate({backgroundColor:"#3455B2"}, 500);
		$(newItem.querySelector("#contentHolder")).animate(
			{backgroundColor:"black"}, 
			{done:function(){
				if(autoToggle){
					toggleSidebarSlow();
					autoToggle = false;
				}
			}}, 500);
		});
	}
	catch(e){
		console.log("can't add div: " + e);
	}
}

function getVideoId(url){
	try{
		var id = url.split("=")[1];
		if(id.indexOf("&") >= 0){
			id = id.split('&')[0];
		}
		addVideoFromId(id);
	} catch(e){
		console.log("Could not find video id");
	}
	
}

function addVideoFromId(id){
	videoList.push(id);
	//storeVideoIds();
	storeVideoObjs();
	getVideoInfo(id);
}


function getVideoInfo(id){
	var Url = "https://youtube.com/get_video_info?video_id=";
	Url+=id;
	Url+="&el=vevo&el=embedded";
	$.ajax({
		type: "GET",
		url: Url,
		success: function(data){
			parseData(data, id);
		}
	});
}

function parseData(data, id){
	var a = data.split("title=")[1];
	var b = a.split("&")[0];
	var decodedTitle = decodeURIComponent(b);
	var title = decodedTitle.split("+").join(" ");
	addVideoToQ(title, id);
}

function injectVideoWatcher(){
	var s = document.createElement('script');
	s.src = chrome.extension.getURL('js/videoWatcher.js');
	s.onload = function(){
		this.parentNode.removeChild(this);
	};
	(document.head||document.documentElement).appendChild(s);
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(request.callFunction){
			if(request.callFunction == "toggleSidebar"){
				toggleSidebar();
			}
		}
		if(request.videoLink){
			getVideoId(request.videoLink);
		}
	});


document.addEventListener('videoEnd', function(e){
	if(e.detail == "videoDone"){
		alertVideoEnded();
	}
});