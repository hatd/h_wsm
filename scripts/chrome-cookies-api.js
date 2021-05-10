"use strict";

async function getAllCookies(domain) {
  return new Promise((resolve, reject) => {
    try {
      chrome.cookies.getAll({domain: domain}, (cookies) => {
        resolve(cookies);
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

async function removeCookie(url, name) {
  return new Promise((resolve, reject) => {
    try {
      chrome.cookies.remove({url: url , name: name}, () => {
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

async function setCookie(url, name, value) {
  return new Promise((resolve, reject) => {
    try {
      chrome.cookies.set({url: url , name: name, value: value}, () => {
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

async function getCookie(url, name) {
  return new Promise((resolve, reject) => {
    try {
      chrome.cookies.get({url: url , name: name}, (cookie) => {
        resolve(cookie);
      });
    } catch (ex) {
      reject(ex);
    }
  });
};
