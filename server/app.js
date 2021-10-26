const express = require("express");
const fs = require("fs");
const app = express();
const http = require("http").Server(app);
const request = require("request");

const prerenderUrl = "http://localhost:3000/";
var regExp = /[a-zA-Z0-9]/g;

app.get("/*", function (req, res) {
  let input, url, language, pathname, fileLocation, file;

  input = req.path.slice(1);
  url = checkUrl(input);
  if (!url || url.origin === "null") {
    res.status(400);
    res.send("invalid input value");
    return;
  }

  language = checkLanguage(url);
  pathname = getPathName(url, language);
  fileLocation = createFileLocationPath(pathname, language);
  if (fileExists(fileLocation)) {
    res.sendFile(__dirname + fileLocation.slice(1));
    return;
  } else {
    request(`${prerenderUrl}${url}`, (err, result) => {
      if (err) {
        return console.log(err);
      }
      fs.appendFileSync(fileLocation, result.body, function (err) {
        if (err) throw err;
      });
      res.sendFile(__dirname + fileLocation.slice(1));
    });
  }
});

const checkUrl = function (path) {
  let url;

  try {
    url = new URL(path);
  } catch (_) {
    return false;
  }
  return url;
};

const checkLanguage = function (url) {
  return url.pathname.startsWith("/ua") ? "ua" : "ru";
};

const getPathName = function (url, language) {
  let result = "";
  if (regExp.test(url.pathname)) {
    if (language === "ru") {
      result = url.pathname.slice(1);
    } else if (language === "ua") {
      result = url.pathname.slice(4);
    }
  }
  return result;
};

const createFileLocationPath = function (pathname, language) {
  if (pathname) {
    let path = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

    if (language === "ua") {
      return `./pages/ua/${path}.html`;
    } else if (language === "ru") {
      return `./pages/ru/${path}.html`;
    }
  } else {
    return `./pages/${language}/home-page.html`;
  }
};

const fileExists = (fileLocation) => {
  try {
    fs.accessSync(fileLocation, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
};

http.listen(8000, function () {
  console.log("listening on *:8000");
});
