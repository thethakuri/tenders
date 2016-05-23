//Custom jQueries

$(function(){
    
    $('.modal').on('show.bs.modal', function(){
        alert('Hello');
        $('.footerbar').css('margin-right', '15px');
        
    });
    $('.modal').on('hide.bs.modal', function () {
        $('.footerbar').css('margin-right', 0);
    });

    /*
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
    
    
    $('.new-account').on('click', function(){
        $.ajax({
            method : 'GET',
            url : '/signup',
            success : function (returnedData) {
                $('#formContent').html(returnedData);
                
            }
            
        })
    })
    */
});