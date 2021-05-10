"use strict";

async function getPackageDirectoryEntry() {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.getPackageDirectoryEntry(async (root) => {
        root.getDirectory("sounds", {create: false}, (localesdir) => {
          var reader = localesdir.createReader();
          reader.readEntries((results) => {
            resolve(results.map((de) => {return de.name;}).sort());
          });
        });
      });
    } catch (ex) {
      reject(ex);
    }
  });
};
