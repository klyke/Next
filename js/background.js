
function queueClicked(info, tab){
	contentAddVideoToQueue(info.linkUrl);
}

function nextVideo(tabId, newVideo){
	var Url = "https://www.youtube.com/watch?v=";
	Url += newVideo;
	chrome.tabs.update(tabId, {
		url: Url
	});
}

function contentToggleSidebar(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
		chrome.tabs.sendMessage(tabs[0].id, {callFunction:"toggleSidebar"}, function(response){
			console.log(response.details);
		});
	});
}

function contentAddVideoToQueue(vidLink){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
	chrome.tabs.sendMessage(tabs[0].id, {videoLink:vidLink}, function(response){
		console.log(response.details);
		});
	});
}

chrome.pageAction.onClicked.addListener(function (tab) {
    contentToggleSidebar();
});

chrome.contextMenus.create({
		'title': 'Add to list',
		'contexts': ['link', 'image'],
		'onclick': queueClicked,
		'documentUrlPatterns':["*://www.youtube.com/*"]
	});

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse){
		if(request.state == "videoDone"){
			nextVideo(sender.tab.id, request.newVideo);
			}
	});

function checkForValidUrl(tabId, changeInfo, tab) {
	//alert(tab.url);
	if (tab.url.indexOf('http://www.youtube.com') > -1 || tab.url.indexOf('https://www.youtube.com') > -1 ) {
		//alert("this is youtube");
		chrome.pageAction.show(tabId);
	}
}

chrome.tabs.onUpdated.addListener(checkForValidUrl);
