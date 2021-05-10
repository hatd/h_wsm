addDefaultEnable();

chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    var alarmName = alarm.name;
    if (alarmName == "h_wsm_remain_unchange") {
      if (await getObject("h_wsm_remain_unchange")) {
        await executeRemainUnchange();
      }
    }
    if (alarmName.match(/h_wsm_remain_form_/g)) {
      if (await getObject("h_wsm_remain_form")) {
        var hWsmSkipNoti = await getObject("h_wsm_skip_noti") || {};
        var datas = await getData(true);
        var missingDates = datas.missingDates;
        var items = [];

        for (var dateKey in missingDates) {
          var missingDate = missingDates[dateKey];
          if (missingDate.request == undefined) {
            if (!hWsmSkipNoti[dateKey]) {
              var message = "";

              if (missingDate.timesheet_inlate) {
                message = `Đi muộn ${missingDate.number_time_fine_minute} phút`;
              } else if (missingDate.timesheet_early_leave) {
                message = `Về sớm ${missingDate.number_time_fine_minute} phút`;
              } else if (missingDate.is_day_off_morning && missingDate.is_day_off_afternoon) {
                message = `Nghỉ cả ngày`;
              } else if (missingDate.is_day_off_morning) {
                message = `Nghỉ buổi sáng`;
              } else if (missingDate.is_day_off_afternoon) {
                message = `Nghỉ buổi chiều`;
              }
              var dateArray = dateKey.split("-");
              var date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
              var weekday = new Intl.DateTimeFormat("vi-VN", {weekday: "short"}).format(date);
              date = `${weekday}  ${dateKey}`;

              items.push({title: date, message: message})
            }
          }
        }
        if (items.length > 0) {
          var options = {
            type: "list",
            iconUrl: "images/16.png",
            title: "Tạo form đi không lại mất tiền!!",
            message: "",
            contextMessage: "H WSM",
            requireInteraction: true,
            buttons: [
              {
                title: "Biết rồi!!!"
              },
              {
                title: "WSM"
              }
            ],
            items: items
          }
          createNotification("h_wsm_remain_form", options);
        }
      }
    }
  } catch (e) {
    showErrorMessage(e);
    throw `${new Date}: ${e.method} - ${e.message}`;
  }
});

async function addDefaultEnable() {
  var promise = new Promise(function(resolve){
    chrome.runtime.onInstalled.addListener(async (_reason) => {
      // default data
      await saveObject({h_wsm_remain_unchange: true});
      await saveObject({h_wsm_remain_form: true});
      await saveObject({h_wsm_remain_form_times: [9, 14]});
      await saveObject({h_wsm_remain_form_sound: true});
      await saveObject({h_wsm_sound_name: "serious-strike.mp3"});

      // default alarm
      await updateAlarm();
    });
  })
  var data = await promise;
}

function showErrorMessage(e) {
  if (e.errorType == "info") {
    var options = {
      type: "basic",
      iconUrl: "images/16.png",
      title: "Ơ kìa, lỗi rồi!!",
      message: e.message,
      contextMessage: "H WSM",
      requireInteraction: true,
      buttons: [
        {
          title: "Setting"
        },
        {
          title: "Log lỗi"
        }
      ]
    }

    createNotification("h_wsm_noti_error", options);
  }
}
