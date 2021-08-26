"use strict";

async function executeRemainUnchange() {
  var account = await getObject("h_wsm_account");
  if (!account) throw formatError("info", "CHƯA NHẬP TÀI KHOẢN THÌ LẤY DỮ LIỆU KIỂU GÌ MÁ ƠI!!!", "executeRemainUnchange")

  await loginWsm(account.email, account.password);
  await loginSgoal();

  var userUrl = await getUserUrl();
  var krIds = await getKRId(userUrl);
  var accessToken = (await getCookie("https://goal.sun-asterisk.vn", "access_token")).value;
  krIds.forEach((id) => {
    remainUnchaged(id, accessToken);
  });
}

async function getUserUrl() {
  try {
    var response = await fetch("https://goal.sun-asterisk.vn/dashboard");
    var result = await response.text();

    // trong service worker khong dung duoc DOM, dm no
    var regex = new RegExp(`<a class="main-menu__link text-decoration-none js-menulink " href="https://goal.sun-asterisk.vn/groups/.*">`);
    var groupLinkElement = result.match(regex)[0]
    if (groupLinkElement) {
      var url = groupLinkElement.match(/https:\/\/goal.sun-asterisk.vn\/groups\/\d+/g)[0];
      if(url){
        return url;
      }
    }
    throw formatError("info", "Không lấy được goal id", "getUserUrl");
  } catch (e) {
    throw formatError("error", e, "getUserUrl");
  }
}

async function getKRId(userUrl) {
  try {
    var krIds = [];
    var response = await fetch(userUrl);
    var result = await response.text();
    var regex = /data-kr_id="\d+"/g
    var remainUnchagedElement = Array.from(result.matchAll(regex));
    remainUnchagedElement.forEach((el) => {
      krIds.push(el[0].match(/\d+/)[0])
    })
    return krIds
  } catch (e) {
    throw formatError("error", e, "getKRId");
  }
}

async function remainUnchaged(objectiveId, accessToken) {
  var url = `https://goal.sun-asterisk.vn/api/v1/objectives/${objectiveId}/remain_unchanged`
  var response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Bearer " + accessToken
    },
    body: `keyResultId=${objectiveId}`
  })
}
