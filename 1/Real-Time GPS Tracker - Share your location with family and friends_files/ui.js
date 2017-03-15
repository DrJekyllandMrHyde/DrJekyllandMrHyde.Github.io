if (typeof com === 'undefined') {
        com = {};
}

if (typeof com.greenalp === 'undefined') {
        com.greenalp = {};
}


$(document).ready(function() {
        if (com.greenalp.mobilePage) {
                var menuheight = $("#menudiv").height();

        var bodyheight = $("body").height();
                var bodywidth = $("body").width();

                if (bodyheight < 200 && bodywidth== 320){
                        var newHeight = 401;

                        if (bodyheight < 174) {
                                newHeight = 375;
                        }

                        $("body").height(newHeight);
                        $("#menudiv").height(newHeight - 50);
                } else {
                        $("#menudiv").height(menuheight - 50);
                }
        }

        $(".menuAction").css("top",  Math.max(170, $(window).height() / 2 - $(".menuAction").height()/2));
        // $(".menuAction").css("left", $("#menudiv").width());

        $(".menuAction").click(function() {
                if (com.greenalp.common.menuhidden) {
                        com.greenalp.common.menuhidden = false;

                        $("#menudiv").animate( {
                                left : "0px"
                        }, 490);


                        $("#tdmainmenu").animate( {
                                "width" : $("#menudiv").width(),
                        		"min-width" : $("#menudiv").width()
                        }, 490);
                        
                        //$("#tdmaincontent").animate( {
                        //   "width" : $("#tdmaincontent").width() - $("#menudiv").width()
                        //}, 490);

                        
                        // $(".menuAction").animate( {
                        // left : $("#menudiv").width() - $(".menuAction").width()
                        // }, 490);

                        $(".menuAction img").attr("src","res/ejectleft.png");



                } else {
                        com.greenalp.common.menuhidden = true;


                        // $(".menuAction").animate( {
                        // left : $("#menudiv").width()+"px"
                        // }, 490);

                        $("#tdmainmenu").animate( {
                                "width" : 0,
                                "min-width" : 0
                        }, 490);
                        
                        //$("#tdmaincontent").animate( {
                        //   "width" : $("#tdmaincontent").width() + $("#menudiv").width()
                        //}, 490);


                        $("#menudiv").animate( {
                                left : -$("#menudiv").width()
                        }, 500);

                        $(".menuAction img").attr("src","res/ejectright.png");
                }
        });

// $(window).scroll(function () {
// $(".menuAction").stop();
// $(".menuAction").animate( {
// top : $(window).scrollTop() + $(window).height() / 2 - 20
// }, 250);
// });




});


com.greenalp.common = {

                menuhidden : false,



                readCookie : function (searchedName) {
                        var allcookies = document.cookie;
                        // Get all the cookies pairs in an array

                        if (allcookies == null) {
                                return null;
                        }

                        cookiearray = allcookies.split(";");

                        for ( var i = 0; i < cookiearray.length; i++) {
                                var pair = cookiearray[i].split('=');
                                var name = $.trim(pair[0]);
                                var value = (pair.length > 0 ? pair[1] : "");

                                if (name == searchedName) {
                                        return unescape($.trim(value));
                                }
                        }
                        return null;
                },

        escapeHtml : function(s) {
                s = s + ""; // in case it was numeric
                return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g,
                                '&gt;');
        },

        onNoWhitespaceBoxKeyPress : function(event) {
                if (event.which == 32) {
                        return false;
                }

                return true;
        },

        onNoWhitespaceBoxTextChanged : function(event) {
                inputbox = jQuery(this);
                inputbox.val(inputbox.val().replace(/\s/g, ""));
        }

};
