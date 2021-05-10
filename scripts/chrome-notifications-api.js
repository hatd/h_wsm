"use strict";

async function createNotification(name, options) {
  if (await getObject("h_wsm_remain_form_sound")) {
    var soundName = await getObject("h_wsm_sound_name");
    var sound = new Audio(`/sounds/${soundName}`);
    sound.play();
  }
  chrome.notifications.create(name, options);
}

function clearNotification(id) {
  chrome.notifications.clear(id);
}

chrome.notifications.onButtonClicked.addListener((id, index) => {
  clearNotification(id);
  if (id == "h_wsm_remain_form" && index == 1) {
    chrome.tabs.create({
      url: "https://wsm.sun-asterisk.vn/vi/dashboard/user_timesheets"
    });
  }
  if (id == "h_wsm_noti_error") {
    if (index == 0) {
      chrome.tabs.create({ url: "options.html" });
    } else {
      chrome.tabs.create({ url: `chrome://extensions/?errors=${chrome.runtime.id}` });
    }
  }
})

chrome.notifications.onClicked.addListener((id) => {
  if (id == "h_wsm_remain_form") {
    clearNotification(id);
    chrome.tabs.create({
      url: "https://wsm.sun-asterisk.vn/vi/dashboard/user_timesheets"
    });
  }
})
