"use strict";

function encodeRequestData(data) {
  var formBody = [];
  for (var property in data) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(data[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  return formBody.join("&");
}

async function loginWsm(email, password) {
  try {
    var sunCookies = await getAllCookies("sun-asterisk.vn");
    sunCookies.forEach(async (cookie) => {
      await removeCookie("https://" + cookie.domain , cookie.name)
    })

    // set cookie, like action access page http://wsm.sun-asterisk.vn
    await setCookie("http://wsm.sun-asterisk.vn", "_wsm_02_session", "aG5NL0ZSR0M1amdlZnVWWUdUY3JZQWgvQlJEa0tCckRsOWQvL09VUDZnSzlKalFzU3cvaW91Z245U1ljekpYUWJ1c0Z1T3A5dTZYQlFPeFVXSkZRdWtzOFVXNC9wUWtFMmc0bjRzN1c3VjFFL1M2cTlMdnBDQmNlWUxQaGZTZlJrdjJDSFZUdjB3THlHa0VXWGtOSXFBPT0tLTJ6NWs3b252b29rWXhtK0kvcnpSb2c9PQ%3D%3D--7ae38e62d95eb0c215ea53d096857a5d428b0b88")

    // login wsm
    var dataLogin = {
      "user[email]": email,
      "user[password]": password,
      "user[remember_me]": "1"
    }
    var response = await fetch("https://wsm.sun-asterisk.vn/vi/users/sign_in", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "content-type": "application/x-www-form-urlencoded",
        "x-csrf-token": "VxfgIWM99d5nGl4gDR2W/LIxIG7gH9DzImFXUH4t+qDb/Genf4a3SoQAkTkwBhcFaIwf9U2Nq7o9z4kxTDt83g=="
      },
      body: encodeRequestData(dataLogin)
    })

    var result = await response.json();
    if (result.success) return;
    throw formatError("info", result.message, "loginWsm")
  } catch (e) {
    throw formatError("error", e, "loginWsm")
  }
}

async function loginSgoal() {
  var url = "https://wsm.sun-asterisk.vn/authorize?client_id=cd398Lu2QqTdJTodWbM5AykC&redirect_uri=https%3A%2F%2Fgoal.sun-asterisk.vn%2Flogin%2Fframgia%2Fcallback&response_type=code"

  try {
    var response = await fetch(url);
    if (response.status != 200 || response.url != "https://goal.sun-asterisk.vn/dashboard") {
      throw formatError("info", "Không vào được sgoal!!!", "loginSgoal")
    }
  } catch (e) {
    throw formatError("error", e, "loginSgoal")
  }
}
