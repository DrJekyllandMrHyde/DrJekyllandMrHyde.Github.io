var windowHeight = $(window).height() ; 
var menuBarHeight = $("#menuBar").height() ;
var codeContainerHeight = windowHeight-menuBarHeight ;

$(".codeContainer").height(codeContainerHeight+"px") ; 

$(".toggle").click(function()
{ 
	$(this).toggleClass("selected") ;
	
	var activeDiv = $(this).html() ;
	$("#"+activeDiv+"Container").toggle() ;
	
	var showingDivs = $(".codeContainer").filter(function()
	{ 
		return($(this).css("display")!="none") ;
	}).length;
	
	var divWidth = 100/showingDivs ;  // now showingDivs is the number of shown divs, so each of them will have width = 100/showingDivs %
	$(".codeContainer").width(divWidth+"%") ;
});

$("#runButton").click(function()
{
	$("iframe").contents().find("html").html('<style>'+$("#cssCode").val()+'</style>'+$("#htmlCode").val()) ;
	
	document.getElementById('resultFrame').contentWindow.eval($("#jsCode").val()) ;
	
});


