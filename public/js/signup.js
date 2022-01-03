$(".btn").on("click", function (e) {
    e.preventDefault();
    const phoneno = $("#phoneno").val();
  
    $.ajax({
      url: "/sleekskincare/signup",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ phoneno: phoneno }),
      success: function (res) {
        if (res.msg.length > 0) {
          $("#err-show").html(res.msg);
          $(".err-login").css("display", "block");
        } else {
            window.location.href = "/sleekskincare/signup-details";
        }
      },
    });
  });