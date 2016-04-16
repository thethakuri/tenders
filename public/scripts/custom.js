//Custom jQueries
$(function (){
    
    // Clear button for search field
    $(".clear").css("right", $("#viewSelect > button").width() + 50 +"px");
    $(".clear").hide();
    $(".clear").click(function(){  
      $(this).hide();
    });
    $(".hasclear").keyup(function(){
        $(".hasclear").val() ? $(".clear").show() : $(".clear").hide();
    });
    
    // Initialize tooltip
    $("[data-toggle = 'tooltip']").tooltip();
    $("#viewSelect > ul > li").click(function(){
       /// alert($("#viewSelect > button").width());
        $(".clear").css("right", $("#viewSelect > button").width() + 50 +"px");
    });
});
