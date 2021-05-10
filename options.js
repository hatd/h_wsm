"use strict";

const CHECKBOX = ["remain_unchange", "remain_form", "remain_form_sound"]

$(document).ready(async () => {
  // default enable function
  CHECKBOX.forEach(async (name) => {
    var checked = await getObject(`h_wsm_${name}`);
    $(`#${name}`).prop("checked", checked);
    if (!checked){$(`#${name}_content`).addClass("display-none")}
  });

  // default time
  var times = await getObject("h_wsm_remain_form_times");
  times.forEach((t) => {
    insertSelectHour(t);
  });

  // default notification sound
  var select = $("#select_sound");
  var soundName = await getObject("h_wsm_sound_name");
  var soundNames = await getPackageDirectoryEntry();
  soundNames.forEach((name) => {
    select.append(new Option(name, name));
  })
  select.val(soundName);
});

$(document).bind("DOMSubtreeModified", function () {
  $(".remove_time").click((e) => {
    $(e.currentTarget).parent().remove();
  })
});

$("#add_time").click(() => {
  insertSelectHour(0);
});

function insertSelectHour(hour) {
  var id = (new Date).getTime() + hour;
  var html = `<div class="select">
                <select class="select-time" id="${id}">
                  <option value="0">00:00</option>
                  <option value="1">01:00</option>
                  <option value="2">02:00</option>
                  <option value="3">03:00</option>
                  <option value="4">04:00</option>
                  <option value="5">05:00</option>
                  <option value="6">06:00</option>
                  <option value="7">07:00</option>
                  <option value="8">08:00</option>
                  <option value="9">09:00</option>
                  <option value="10">10:00</option>
                  <option value="11">11:00</option>
                  <option value="12">12:00</option>
                  <option value="13">13:00</option>
                  <option value="14">14:00</option>
                  <option value="15">15:00</option>
                  <option value="16">16:00</option>
                  <option value="17">17:00</option>
                  <option value="18">18:00</option>
                  <option value="19">19:00</option>
                  <option value="20">10:00</option>
                  <option value="21">21:00</option>
                  <option value="22">22:00</option>
                  <option value="23">23:00</option>
                </select>
                <button type="button" class="button red remove_time">-</button>
              </div>`
  $(".last-select").before(html);
  $(`#${id}`).val(hour)
}

["remain_form", "remain_form_sound"].forEach((id) => {
  $(`#${id}`).change((e) => {
    if($(e.currentTarget).is(":checked")) {
      $(`#${id}_content`).removeClass("display-none");
    } else {
      $(`#${id}_content`).addClass("display-none");
    }
  })
})

$("#play").click(() => {
  var soundName = $("#select_sound").val();
  var myAudio = new Audio(`/sounds/${soundName}`);
  myAudio.play();
})

$("#save_option").click(() => {
  // save checkbox
  CHECKBOX.forEach((name) => {
    var key = `h_wsm_${name}`;
    var obj = {[key]: $(`#${name}`).is(":checked")};
    saveObject(obj);
  });

  // save times
  var times = $(".select-time").map((_, select) => {
    return $(select).val();
  });
  times = [...new Set(times)];
  saveObject({h_wsm_remain_form_times: times});

  // save sound notification
  var soundName = $("#select_sound").val();
  saveObject({h_wsm_sound_name: soundName});

  // update alarm schedule
  updateAlarm();

  // change text button save and close window
  changeTextSave();
});

function changeTextSave() {
  $("#save_option").text("Saved")

  setTimeout(() => {
    window.close()
  }, 1500)
}

$("#account").click(async () => {
  showMessage("")

  // default account
  var account = await getObject("h_wsm_account");
  if (account) {
    $("#email").val(account.email);
    $("#password").val(account.password);
  }

  $("#modal-container").removeAttr("class").addClass("active");
})

$(".close-modal").click(() => {
  $("#modal-container").addClass("out");
})

$("#login").click(async () => {
  showMessage("")
  var email = $("#email").val();
  var password = $("#password").val();

  if (email == "" || password == "") {
    showMessage("ĐỂ TRỐNG THÌ ĐĂNG NHẬP KIỂU GÌ!!!", "error");
    return;
  }
  var button = $("#login");
  button.attr("disabled", true);

  try {
    await loginWsm(email, password);

    var h_wsm_account = {email: email, password: password};
    await saveObject({h_wsm_account: h_wsm_account});
    showMessage("Đăng nhập thành công.");
    setTimeout(() => {
      $("#modal-container").addClass("out");
    }, 1500)
    button.attr("disabled", false);
  } catch (e) {
    showMessage(e.message, "error");
    button.attr("disabled", false);
    throw `${new Date}: ${e.method} - ${e.message}`;
  }
})

function showMessage(message, className="success") {
  $("#message").text(message).removeClass().addClass(className);
}
