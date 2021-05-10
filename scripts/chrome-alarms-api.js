"use strict";

function createAlarm(alarmName, hour) {
  var scheduleDate = new Date()
  if (scheduleDate.getHours() >= hour) {
    scheduleDate.setDate(scheduleDate.getDate() + 1)
  }
  scheduleDate.setHours(hour, 0, 0)

  chrome.alarms.create(
    alarmName,
    {when: scheduleDate.getTime(), periodInMinutes: 1440}
  )
}

async function clearAlarm() {
  return new Promise((resolve, reject) => {
    try {
      chrome.alarms.clear(function() {
        resolve();
      })
    } catch (ex) {
      reject(ex);
    }
  });
};

async function updateAlarm() {
  // clear all current alarm
  await chrome.alarms.clearAll();

  // alarm remain unchange
  var remain_unchange = await getObject("h_wsm_remain_unchange");
  if(remain_unchange) {
    createAlarm("h_wsm_remain_unchange", 10);
  }

  // alarm remain form
  var remain_form = await getObject("h_wsm_remain_form");
  if (remain_form) {
    var hours = await getObject("h_wsm_remain_form_times");
    hours.forEach((hour) => {
      createAlarm(`h_wsm_remain_form_${hour}`, hour);
    })
  }
}
