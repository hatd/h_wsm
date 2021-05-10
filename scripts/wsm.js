"use strict";

async function getData(forNoti=true) {
  var data = await getDataWsm();
  var timesheets = data.content.usertimesheets.timesheets;

  // format ["2021-05-01", "2021-05-03"]
  var remainDates = [];
  if (forNoti){
    remainDates = getRemainDatesForNoti(timesheets);
  } else {
    remainDates = getRemainDatesForPopup(timesheets);
  }

  var missingDates = getMissingDate(remainDates, timesheets);
  missingDates = checkRequest(missingDates, data.requestLeaves, data.requestOffs);

  return {missingDates: sortObj(missingDates), updatedAt: data.content.last_time_update.updated_at};
}

async function getDataWsm() {
  var account = await getObject("h_wsm_account");
  if (!account) throw formatError("info", "CHƯA NHẬP TÀI KHOẢN THÌ LẤY DỮ LIỆU KIỂU GÌ MÁ ƠI!!!", "getDataWsm");

  await loginWsm(account.email, account.password);

  var content = await getUserTimeSheets();
  var userId = content.usertimesheets.user.id;
  var requestOffs = await getRequestOffs(userId);
  var requestLeaves = await getRequestLeaves(userId);

  return {
    content: content,
    requestOffs: requestOffs,
    requestLeaves: requestLeaves
  }
}

async function getUserTimeSheets() {
  try {
    var response = await fetch("https://wsm.sun-asterisk.vn/dashboard/user_timesheets", {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "x-requested-with": "XMLHttpRequest"
      }
    })
    if (response.status != 200 ) throw formatError("info", "Lấy user timesheets thất bại!!!", "getUserTimeSheets");

    var result = await response.json();

    return result.content;
  } catch (e) {
    throw formatError("error", e, "getUserTimeSheets");
  }
}

async function getRequestOffs(userId) {
  try {
    var requestOffs = {};
    var response = await fetch(`https://wsm.sun-asterisk.vn/vi/dashboard/users/${userId}/request_offs?page=1`, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "x-requested-with": "XMLHttpRequest"
      },
      "method": "GET"
    });
    if (response.status != 200 ) throw formatError("info", "Lấy request offs thất bại!!!", "getRequestOffs");

    var result = await response.text();
    var listTr = Array.from(result.matchAll(/<tr[\s\S]*?<\\\/tr>/g));
    listTr.forEach((tr) => {
      if (!tr[0].match(/<td class=\\"status-[\s\S]*?label-success/g) &&
        !tr[0].match(/<td class=\\"status-[\s\S]*?label-primary/g)) {
        var listTd = Array.from(tr[0].matchAll(/<td[\s\S]*?<\\\/td>/g));
        var from = listTd[3][0].match(/\d+-\d+-\d+/)[0];
        var to = listTd[4][0].match(/\d+-\d+-\d+/)[0];
        var dayNumber = listTd[6][0].match(/\d+\.\d+/g);
        dayNumber = dayNumber[dayNumber.length - 1];
        var dateArray = from.split("-");
        var date = [dateArray[2], dateArray[1], dateArray[0]].join("-");
        requestOffs[date] = {from: from, to: to, dayNumber: dayNumber};
      }
    });

    return requestOffs;
  } catch (e) {
    throw formatError("error", e, "getRequestOffs")
  }
}

async function getRequestLeaves(userId) {
  try {
    var requestLeaves = {};
    var response = await fetch(`https://wsm.sun-asterisk.vn/vi/dashboard/users/${userId}/request_leaves?page=1`, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "x-requested-with": "XMLHttpRequest"
      },
      "method": "GET"
    });
    if (response.status != 200 ) throw formatError("info", "Lấy request leaves thất bại!!!", "getRequestLeaves");

    var result = await response.text();
    var listTr = Array.from(result.matchAll(/<tr[\s\S]*?<\\\/tr>/g));
    listTr.forEach((tr) => {
      var listTd = Array.from(tr[0].matchAll(/<td[\s\S]*?<\\\/td>/g));
      var dateArray = listTd[3][0].match(/\d+\/\d+\/\d+/g)[0].split("/");
      var date = [dateArray[2], dateArray[1], dateArray[0]].join("-");
      var requestTime = listTd[3][0].replace(/\s/g, "").replace(/<td>\\n/, "").replace(/\\n<\\\/td>/, "");
      var workStoppage = listTd[5][0].replace(/\s/g, "").replace(/<td>\\n/, "").replace(/\\n<\\\/td>/, "");
      var time = listTd[7][0].replace(/\s/g, "").replace(/<td>\\n/, "").replace(/\\n<\\\/td>/, "");
      requestLeaves[date] = {requestTime: requestTime, workStoppage: workStoppage, time: time};
    });

    return requestLeaves
  } catch (e) {
    throw formatError("error", e, "getRequestLeaves")
  }
}

var currentDate = new Date();
function getRemainDatesForNoti(timesheets) {
  var remainDates = [];

  var dateInWeek = currentDate.getDay();

  switch(dateInWeek) {
    case 0:
      // chu nhat, lay thu 6,5
      remainDates = [-2, -3];
      remainDates = checkValidDate(remainDates, timesheets);
      break;
    case 1:
      // thu 2, lay thu 2; 6, 5 tuan trc
      remainDates = [0, -3, -4];
      remainDates = checkValidDate(remainDates, timesheets);
      break;
    case 2:
      // thu 3, lay thu 3, 2; 6 tuan trc
      remainDates = [0, -1, -4];
      remainDates = checkValidDate(remainDates, timesheets);
      break;
    case 6:
      // thu 7, lay thu 6, 5
      remainDates = [-1, -2];
      remainDates = checkValidDate(remainDates, timesheets);
      break;
    default:
      // con lai, lay ngay hien tai, va 2 ngay trc
      remainDates = [0, -1, -2];
      remainDates = checkValidDate(remainDates, timesheets);
  }

  return remainDates
}

function getRemainDatesForPopup(timesheets) {
  var remainDates = [];
  for (var dateKey in timesheets) {
    var dateArray = dateKey.split("-");
    var date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
    if (date.getDay() != 0 && date.getDay() != 6) {
      remainDates.push(dateKey);
    }
  }
  return remainDates;
}

function checkValidDate(remainDates, timesheets) {
  // step1 replace holiday
  var replaceHolidays = [];
  var removeHolidays = [];
  remainDates.forEach((d) => {
    var dateKey = getDateKey(d)
    var dateTimeSheet = timesheets[dateKey]
    if (dateTimeSheet) {
      if (dateTimeSheet.holiday) {
        var difference = replaceHolidays.slice(-1)[0];
        if (difference == undefined) {difference = remainDates.slice(-1)[0]}
        replaceHolidays.push(difference - 1);
        removeHolidays.push(d);
      }
    }
  })
  remainDates = remainDates.filter(val => !removeHolidays.includes(val));
  remainDates = remainDates.concat(replaceHolidays);

  // step2 remove date not in month, and replace with date format
  var removeInvalidDate = [];
  remainDates.forEach((d, index) => {
    var dateKey = getDateKey(d)
    var dateTimeSheet = timesheets[dateKey]
    if (dateTimeSheet) {
      remainDates[index] = dateKey;
    } else {
      removeInvalidDate.push(d);
    }
  })

  return remainDates.filter(val => !removeInvalidDate.includes(val));
}

// check date is IL, LE, off morning, off afternoon
function getMissingDate(remainDates, timesheets) {
  var missingDates = {};
  remainDates.forEach((dateKey) => {
    var timesheet = timesheets[dateKey];

    if (timesheet.is_day_off_afternoon || timesheet.is_day_off_morning ||
      timesheet.timesheet_early_leave || timesheet.timesheet_inlate) {
      missingDates[dateKey] = timesheet;
    }

    // if current date have check in > 7h45
    if (timesheet.time_sheet_date) {
      var timeIn = new Date(timesheet.time_sheet_date.time_in);
      if (timesheet.time_sheet_date.time_out == null) {
        if ((timeIn.getHours()*60 + timeIn.getMinutes()) > 465) {
          missingDates[dateKey] = timesheet;
        }
      }
    }
  })

  return missingDates
}

function checkRequest(missingDates, requestLeaves, requestOffs) {
  // chưa ưng đoạn check request off này cho lắm
  var flattenRequestOffs = [];
  for (var dateKey in requestOffs) {
    var request = requestOffs[dateKey];
    var fromArray = request.from.split("-");
    var from = new Date(fromArray[2], fromArray[1] - 1, fromArray[0]);
    var toArray = request.to.split("-");
    var to = new Date(toArray[2], toArray[1] - 1, toArray[0]);

    var date = from;
    while (date <= to) {
      flattenRequestOffs.push([date.getFullYear(), addPrefixZero(date.getMonth() + 1), addPrefixZero(date.getDate())].join("-"));
      date = new Date(date - 0 + 86400000);
    }
  }

  for (var dateKey in missingDates) {
    var data = missingDates[dateKey];
    if (data.timesheet_inlate || data.timesheet_early_leave) {
      var request = requestLeaves[dateKey];
      if (request) {data.request = request}
    }

    if (data.is_day_off_afternoon || data.is_day_off_morning) {
      if (flattenRequestOffs.includes(dateKey)) {data.request = true}
    }
  }

  return missingDates;
}

function getDateKey(difference) {
  var date = new Date(currentDate - 0 + difference*86400000);
  return [date.getFullYear(), addPrefixZero(date.getMonth() + 1), addPrefixZero(date.getDate())].join("-");
}

function addPrefixZero(number) {
  if(number < 10) return "0" + number;
  return number;
}

function sortObj(obj) {
  return Object.keys(obj).sort((a, b) => {return a<b ? 1 : -1}).reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});
}
