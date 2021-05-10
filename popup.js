"use strict";

$(document).ready(async () => {
  try {
    var datas = await getData(false);
    var missingDates = datas.missingDates;

    if ($.isEmptyObject(missingDates)) {
      $("#table").addClass("display-none");
      $("#message").text("Không có ngày nào cần tạo form").removeClass("display-none");
    } else {
      var body = $("#table").find("tbody");
      var hWsmSkipNoti = await getObject("h_wsm_skip_noti") || {};
      for (var dateKey in missingDates) {
        body.append(buildTr(dateKey, missingDates[dateKey], hWsmSkipNoti));
      }
    }

    var updatedAt = new Date(datas.updatedAt);
    updatedAt = new Intl.DateTimeFormat("vi-VN", {timeStyle: "short", dateStyle: "short"}).format(updatedAt);

    $("#updated_at").text(`Cập nhật lúc: ${updatedAt}`);
    $("#loader").addClass("display-none");
    $("#popup").removeClass("display-none");
  } catch (e) {
    showErrorMessage("Ơ kìa, lỗi rồi!!!\n" + e.message);
    throw `${new Date}: ${e.method} - ${e.message}`;
  }
})

$(document).bind("DOMSubtreeModified", function () {
  $(".skip-noti").click(async (e) => {
    var id = e.currentTarget.id;
    await skipNoti(id, e.currentTarget.checked)
  })
});

function buildTr(dateKey, data, hWsmSkipNoti) {
  var dateArray = dateKey.split("-");
  var date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
  var weekday = new Intl.DateTimeFormat("vi-VN", {weekday: "short"}).format(date);
  date = `${weekday} ${dateKey}`;

  var timeInClass = "", timeOutClass = "";
  if (data.is_day_off_morning) {
    timeInClass = "bg-green";
  }
  if (data.is_day_off_afternoon) {
    timeOutClass = "bg-green";
  }
  if (data.timesheet_inlate) {
    timeInClass = "bg-red";
  }
  if (data.timesheet_early_leave) {
    timeInClass = "bg-red";
  }

  var timeIn = "", timeOut = "";
  if (data.time_sheet_date) {
    timeIn = new Date(data.time_sheet_date.time_in);
    timeIn = [timeIn.getHours(), timeIn.getMinutes()].join(":");

    timeOut = data.time_sheet_date.time_out
    if (timeOut == null) {
      timeOut = ""
    } else {
      timeOut = new Date(timeOut);
      timeOut = [timeOut.getHours(), timeOut.getMinutes()].join(":");
    }
  }
  var com = 0;
  if (data.number_time_fine_minute != 0) {
    com = data.number_time_fine_minute;
  }

  var request = data.request
  if (request == undefined) {
    request = "Chưa tạo form";
  } else if (request == true) {
    request = "Đã tạo form nhưng chưa được approve";
  } else {
    var requestDateArray = request.workStoppage.split(/\\n/);
    var requestTimeArray = request.time.split(/\\n/);
    request = [requestDateArray[0], requestDateArray[1], requestTimeArray[0]].join("\n");
  }

  var checked = hWsmSkipNoti[dateKey];

  return `<tr>
            <td class="date">${date}</td>
            <td class="time">
              <div class="event-timesheets">
                <div class="check-time check-in ${timeInClass}">${timeIn}</div>
                <div class="check-time check-out ${timeOutClass}">${timeOut}</div>
              </div>
              ${com != 0 ? `<div class="view-ot-com">${com}</div>` : ""}
            </td>
            <td class="request">${request}</td>
            <td class="action">
              <input class="skip-noti" id="${dateKey}" ${checked == true ? "checked" : ""} type="checkbox">
            </td>
          </tr>`
}

async function skipNoti(dateKey, value) {
  var hWsmSkipNoti = await getObject("h_wsm_skip_noti");
  if (hWsmSkipNoti) {
    hWsmSkipNoti[dateKey] = value;
  } else {
    hWsmSkipNoti = {[dateKey]: value};
  }

  await saveObject({h_wsm_skip_noti: hWsmSkipNoti});
}

$("#wsm").click(() => {
  chrome.tabs.create({
    url: "https://wsm.sun-asterisk.vn/vi/dashboard/user_timesheets"
  });
})

function showErrorMessage(message) {
  $("#message").text(message).removeClass("display-none");
  $("#table").addClass("display-none");
  $("#wsm").addClass("display-none");
  $("#loader").addClass("display-none");
  $("#popup").removeClass("display-none");
}
