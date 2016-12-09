    var string = "";
		var showingDivs = 0;
		var width = 100;
		//$("#html").css("background-color", #808080);
		// when clicking a button
		$(".b").click(function(){
			// if it is already clicked...
			if($(this).hasClass("active")){
				// remove active class to unselect it
				$(this).removeClass("active");
				// untoggle the container
				string = (this.id);
				$("#" + string + "Container").toggle();
				// set codeContainers
				showingDivs = showingDivs - 1;
				var width = 100 / showingDivs;
				$(".codeContainer").css("width", width + "%");
			// if it is unclicked
			} else {
				// make it active
				$(this).addClass("active");
				// toggle the container
				string = (this.id);
				$("#" + string + "Container").toggle();
				// set codeContainers
				showingDivs = showingDivs + 1;
				var width = 100 / showingDivs;
				$(".codeContainer").css("width", width + "%");
			}
		});
		// set the height of the codeContainers
		var windowHeight = $(window).height();
		var menuHeight = $("header").height();
		var codeConHeight = windowHeight - menuHeight;
		$(".codeContainer").height(codeConHeight + "px");
		// run code
		$("#run").click(function(){
			$("iframe").contents().find("html").html('<style>' + $("#cssCode").val() + '</style>' + $("#htmlCode").val());
		});
		document.getElementById('result').contentWindow.eval( $('#jsCode').val() );