//console.log("video watcher added");

setTimeout(function(){
	try{
		var player = document.getElementById("movie_player");
		player.addEventListener("onStateChange", "onPlayerStateChange");
		//console.log("Found the Player");
	}catch(exception){
		console.log("player not found");
	}
}, 1500);

function sendMessageToContentScript(){
document.dispatchEvent(new CustomEvent('videoEnd', {
		detail: 'videoDone'
	}));
}

onPlayerStateChange = function (state){
	if (state === 0){
		//console.log("video done")
		sendMessageToContentScript();
	}
}
