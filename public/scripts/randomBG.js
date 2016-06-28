$(document).ready(function(){
	var bgArray = ['1.jpg', '2.jpg', '3.jpg', '4.jpg'];
	var bg = bgArray[Math.floor(Math.random() * bgArray.length)];
	var path = '../assets/background/';
	$('body').css('background-image', 'url(' + path + bg +')');
});