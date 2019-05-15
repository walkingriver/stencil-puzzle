
var fcBorder = null, fc, fabricImages, imagePromises;
var puzzleMenu;
var puzzleProgressBar;
var puzzleProgressBarLabel;
var selectPuzzle;

fabric.Image.prototype.onMove = function (el) {
  if (!el.originalCoords) {
    return;
  }

  var tl = Math.pow(el.getLeft() - el.originalCoords[0], 2);
  var tt = Math.pow((el.getTop() - el.originalCoords[1]), 2);

  if (Math.sqrt(tl + tt) < 10) {
    el.set("left", el.originalCoords[0]);
    el.set("top", el.originalCoords[1]);
    el.set("lockMovementX", true);
    el.set("lockMovementY", true);
    el.set("selectable", false);
    el.sendToBack();
    el.isCorrect = true;

    fcBorder.set("stroke", "#337ab7");
    window.setTimeout(function () {
      fcBorder.set("stroke", "#ffffff");
      fc.renderAll();
    }, 1000);

    if (fabricImages.every(img => img.isCorrect)) {
      document.getElementById('victory-banner').remove("hidden");
    }
  }

};

function copyImageChunk(ctx, img, pos) {

  var copiedCanvas = document.createElement("canvas"), copiedCtx = copiedCanvas.getContext('2d');
  var maskCanvas = document.createElement("canvas"), maskCanvasCtx = maskCanvas.getContext('2d');
  var w = img.width, h = img.height;

  maskCanvas.width = w;
  maskCanvas.height = h;

  copiedCanvas.width = w;
  copiedCanvas.height = h;

  copiedCtx.drawImage(img, 0, 0);
  maskCanvasCtx.putImageData(ctx.getImageData(pos.copyX, pos.copyY, w, h), 0, 0);

  copiedCtx.globalCompositeOperation = "source-in";
  copiedCtx.drawImage(maskCanvas, 0, 0);

  var df = new Promise((resolve, reject) => {
    fabric.Image.fromURL(copiedCanvas.toDataURL("image/png"), function (img) {

      img.set("hasBorders", false);
      img.set("left", pos.offsetW);
      img.set("top", pos.offsetH);

      img.hasControls = false;
      img.lockRotation = true;
      img.lockScalingX = true;
      img.lockScalingY = true;

      img.originalCoords = [pos.offsetW, pos.offsetH];
      img.isCorrect = false;

      fc.add(img);

      fabricImages.push(img);
      resolve(img);
    });
  });

  imagePromises.push(df);
}

function getImg(loadedImages, el) {
  return loadedImages.find(x => x.src.endsWith(el));
}

function setup(ctx, loadedImages, puzzleImage) {

  var imageHeight = puzzleImage.height, imageWidth = puzzleImage.width;
  var maxHeight = window.innerHeight - 60, maxWidth = window.innerWidth - 60;
  var targetHeight, targetWidth, offsetLeft = 0, offsetTop = 0;

  fc.setWidth(maxWidth);
  fc.setHeight(maxHeight);

  if (imageHeight / imageWidth < window.innerHeight / window.innerWidth) {
    targetWidth = maxWidth;
    targetHeight = Math.floor((targetWidth * imageHeight) / imageWidth);
  } else {
    targetHeight = maxHeight;
    targetWidth = Math.floor((targetHeight * imageWidth) / imageHeight);
  }

  offsetTop = (maxHeight - (targetHeight * .85)) / 2;
  offsetLeft = (maxWidth - (targetWidth * .9)) / 2;

  var cornerLeft = getImg(loadedImages, "1.png").width * .7, cornerRight = getImg(loadedImages, "9.png").width * .7;
  var midLeft = getImg(loadedImages, "2.png").width * .7, midRight = getImg(loadedImages, "3.png").width * .7;
  var middleSide = getImg(loadedImages, "4.png").width * .73, cornerBottom = getImg(loadedImages, "7.png").width * .73;

  var numWide = 2 + (Math.floor((targetWidth - (cornerLeft + cornerRight)) / (midLeft + midRight)) * 2);
  var cornerLeftHeight = getImg(loadedImages, "1.png").width * .92;
  var numHeight = Math.floor((targetHeight - (cornerLeftHeight + cornerBottom)) / middleSide);

  var filledGrid = ["4.png"], piecesGrid = [["1.png"]], lastGrid = ["7.png"];

  for (var j = 1; j < numWide - 1; j++) {
    if (j % 2 == 0) {
      filledGrid.push("6.png");
      lastGrid.push("12.png");
      piecesGrid[0].push("3.png");
    } else {
      filledGrid.push("5.png");
      lastGrid.push("11.png");
      piecesGrid[0].push("2.png");
    }
  }

  filledGrid.push("10.png");
  piecesGrid[0].push("9.png");
  lastGrid.push("8.png");

  for (var i = 1; i < numHeight; i++) {
    piecesGrid[i] = filledGrid;
  }

  piecesGrid[numHeight] = lastGrid;
  ctx.drawImage(puzzleImage, 0, 0, targetWidth, targetHeight);

  return {
    piecesGrid: piecesGrid,
    offsetW: offsetLeft, offsetH: offsetTop,
    globalOffsetW: offsetLeft, globalOffsetH: offsetTop
  };
}

function max(arr, gt) {
  return arr.slice(1).reduce((max, cur) => gt(max, cur) ? max : cur, arr[0]);
}

function iterativeCopy(res) {

  if (res.i >= res.piecesGrid.length && res.j == 0) {

    Promise.all(imagePromises).then(() => {
      var lastImg = max(fabricImages, (a, b) => a.getLeft() + a.getTop() > b.getLeft() + b.getTop())

      var width = lastImg.getBoundingRect().left + lastImg.getBoundingRect().width,
        height = lastImg.getBoundingRect().top + lastImg.getBoundingRect().height;

      fcBorder = new fabric.Rect({
        top: res.globalOffsetH,
        left: res.globalOffsetW,
        width: width - res.globalOffsetW, height: height - res.globalOffsetH,
        stroke: "white", strokeWidth: 5,
        fill: "transparent",
        hasControls: false, lockRotation: true,
        lockMovementX: true, lockMovementY: true,
        hasBorders: false
      });

      fc.add(fcBorder);
      fcBorder.sendToBack();

      fc.renderAll();

      var targetWidth, targetHeight;

      var previewWidth = puzzleMenu.offsetWidth, previewHeight = puzzleMenu.offsetHeight;

      if (height / width < previewHeight / previewWidth) {
        targetWidth = previewWidth;
        targetHeight = Math.floor((targetWidth * height) / width);
      } else {
        targetHeight = previewHeight;
        targetWidth = Math.floor((targetHeight * width) / height);
      }

      const previewCanvas = document.getElementById("previewCanvas");
      const previewCtx = previewCanvas.getContext("2d");

      previewCanvas.width = targetWidth;
      previewCanvas.height = targetHeight;

      previewCtx.drawImage(res.canvas, 0, 0, targetWidth, targetHeight);

      document.querySelector("[data-provide='loading']").classList.add("hidden");

      document.getElementById('main-container').classList.remove('hidden');
      document.querySelectorAll('[data-provide="puzzle-btns"]').forEach(e => e.classList.remove("hidden"));

      window.setTimeout(() => {
        shuffle();
        fc.calcOffset();
      }, 1000);
    });

    return false;
  }

  var piecesGrid = res.piecesGrid;
  var img = null;

  innerOffsetH = 0, innerOffsetW = 0;

  img = getImg(res.loadedImages, piecesGrid[res.i][res.j]);

  if (res.i == 0 && res.j == 1) {
    innerOffsetW = -4;
  }

  if (res.i > 0) {
    if (res.j > 0 && res.j % 2 == 0) {
      innerOffsetH = 0;
    }

    if (res.j > 0 && res.j % 2 == 1) {
      innerOffsetH = -30;
    }

    if (res.j == piecesGrid[res.i].length - 1) {
      innerOffsetH = -29;
    }
  }

  var pos = {
    copyX: res.copyX + innerOffsetW, copyY: res.copyY + innerOffsetH,
    offsetW: res.offsetW + innerOffsetW,
    offsetH: res.offsetH + innerOffsetH
  };

  copyImageChunk(res.ctx, img, pos);

  var addW = null;
  if (res.i == 0) {
    addW = img.width * .7;
  } else if (res.i < piecesGrid.length - 1) {

    if (res.j < piecesGrid[res.i].length - 2 && res.j % 2 == 0) {
      addW = img.width * .73;
    }

    if (res.j < piecesGrid[res.i].length - 2 && res.j % 2 == 1) {
      addW = img.width * .61;
    }

    if (res.j == piecesGrid[res.i].length - 2) {
      addW = img.width * .75;
    }

  } else if (res.i == res.piecesGrid.length - 1) {

    if (res.j < res.piecesGrid[res.i].length - 2 && res.j % 2 == 0) {
      addW = img.width * .71;
    }

    if (res.j < res.piecesGrid[res.i].length - 2 && res.j % 2 == 1) {
      addW = img.width * .7;
    }

    if (res.j == res.piecesGrid[res.i].length - 2) {
      addW = img.width * .7;
    }

  }

  res.offsetW += addW;
  res.copyX += addW;
  res.j += 1;

  if (res.j == piecesGrid[res.i].length) {

    res.i += 1;
    res.j = 0;

    res.offsetW = res.globalOffsetW;
    res.copyX = 0;

    var addH = null;
    if (res.i == 0) {
      addH = img.height * .92;
    } else if (res.i == piecesGrid.length - 2) {
      addH = img.height * .74;
    } else {
      addH = img.height * .73;
    }

    res.offsetH += addH;
    res.copyY += addH;
  }

  var percentComplete = Math.floor((fabricImages.length / (piecesGrid.length * piecesGrid[0].length)) * 100);
  percentComplete = Math.floor(percentComplete / 2) * 2;

  puzzleProgressBar.style.width = `${percentComplete}%`;
  puzzleProgressBarLabel.innerText = `${percentComplete}%`;

  window.requestAnimationFrame(function () {
    iterativeCopy(res);
  });
}

function bootstrap(imageUrl, loadedImages) {
  window.location.hash = imageUrl;

  var puzzleImage = new Image();
  puzzleImage.src = "images/" + imageUrl;

  const imageDfs = loadedImages.map(x => x.df);
  var df = new Promise((resolve, reject) => {
    puzzleImage.addEventListener("load", function () { resolve(this); });
  });

  imageDfs.push(df);

  var canvas = document.createElement("canvas"), ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  Promise.all(imageDfs).then(() => {
    var res = {
      ctx: ctx, canvas: canvas, loadedImages: loadedImages,
      offsetW: 0, offsetH: 0, i: 0, j: 0, copyX: 0, copyY: 0
    };
    var setupResult = setup(ctx, loadedImages, puzzleImage);

    res = Object.assign(res, setupResult);

    window.requestAnimationFrame(function () { iterativeCopy(res); });
  });
}

function init() {

  fc = new fabric.Canvas("canvas", { backgroundColor: 'rgb(0, 0, 0)', border: "1px solid white" });
  fc.selection = false;

  fabricImages = [];
  imagePromises = [];

  puzzleProgressBar.style.width = '1%';
  puzzleProgressBarLabel.innerText = '1%';

  fc.on("object:moving", function (el) {
    if (el.target.onMove) {
      el.target.onMove(el.target);
    }
  });

  fc.renderAll();
}

function showLoadingScreen() {
  // document.getElementById('url-error').classList.add("hidden");
  selectPuzzle.classList.add("hidden");
  document.querySelector("[data-provide='loading']").classList.remove("hidden");
}

function hide(el) {
  el.style.display = 'none';
}

function show(el) {
  el.style.display = 'block';
}


function shuffle() {
  var onChange = function () {
    window.requestAnimationFrame(function () {
      fc.renderAll.bind(fc)();
    });
  };

  fabricImages
    .filter(e => !e.isCorrect)
    .forEach((img) => {
      var left = Math.floor((Math.random() * fc.getWidth() * .75) + (fc.getWidth() * .05));
      var top = Math.floor((Math.random() * fc.getHeight() * .75) + (fc.getHeight() * .05));
      img.animate({ left: left, top: top }, { onChange: onChange });
    });

  return false;
}


function getHint() {
  const incorrectImages = fabricImages.filter(e => !e.isCorrect);
  const j = Math.floor(Math.random() * incorrectImages.length);
  const img = incorrectImages[j];

  if (!img) {
    return false;
  }

  var onChange = function () {
    window.requestAnimationFrame(function () {
      fc.renderAll.bind(fc)();
    });
  };

  img.animate({ left: img.originalCoords[0], top: img.originalCoords[1] },
    { onComplete: function (e) { img.onMove(img); }, onChange: onChange });

  return false;
};


$(document).ready(startup);

function startup() {
  puzzleMenu = document.getElementById('puzzle-menu');
  puzzleProgressBar = document.querySelector("[data-provide='puzzle-progress']");
  puzzleProgressBarLabel = document.querySelector("[data-provide='puzzle-progress'] span");
  selectPuzzle = document.getElementById('select-puzzle');

  var loadedImages =
    ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png",
      "7.png", "8.png", "9.png", "10.png", "11.png", "12.png"]
      .map((src) => {
        var img = new Image();
        img.src = "puzzle_pieces/" + src;
        img.df = new Promise((resolve, reject) => {
          img.addEventListener("load", () => resolve(this));
        });

        return img;
      });

  var windowHash = window.location.hash.replace("#", "");
  if (windowHash.length) {
    showLoadingScreen();
    bootstrap(windowHash, loadedImages);
  }

  // document.getElementById('select-image-form').onsubmit = onFormSubmit;

  // function onFormSubmit() {
  //   var url = $(this).find("#imageUrl").val();
  //   var errorDiv = $("[data-provide='url-error']");

  //   if (url.length == 0) {
  //     errorDiv.removeClass("hidden").text("Sorry! You need to enter a URL.");
  //     return false;
  //   }

  //   var inputGroup = $(this).find(".input-group:first");
  //   var progressDiv = $(this).find(".progress");

  //   inputGroup.addClass("hidden");
  //   progressDiv.removeClass("hidden");

  //   var showUrlField = function () {
  //     inputGroup.removeClass("hidden");
  //     progressDiv.addClass("hidden");
  //   };

  //   var xhr = $.post("download.php", { url: url }, function (result) {
  //     showUrlField();
  //     if (result.error) {
  //       errorDiv.removeClass("hidden").text(result.error);
  //     } else {
  //       showLoadingScreen();
  //       bootstrap(result.filename, loadedImages);
  //     }
  //   });

  //   var ticks = 1;
  //   var timer = window.setInterval(function () {
  //     var at = Math.ceil((ticks / 100) * 100);
  //     ticks += 1;

  //     progressDiv.find(".progress-bar").css("width", at);
  //     progressDiv.find("span").text(at);

  //     if (ticks > 100) {
  //       window.clearInterval(timer);
  //       showUrlField();
  //       errorDiv.removeClass("hidden").text("Sorry! There was a problem loading your image.");
  //       xhr.abort();
  //     }
  //   }, 300);

  //   return false;
  // }

  document.querySelectorAll("a[data-provide='select-image']")
    .forEach(e => {
      e.onclick = (event) => {
        event.preventDefault();
        const href = e.attributes.getNamedItem('href').value;
        showLoadingScreen();
        bootstrap(href.replace('#', ''), loadedImages);
        return false;
      }
    });

  $("[data-provide='show-menu']").click(function () {

    var group = $(this).parents(".btn-group");

    if ($(group).hasClass("open")) {
      $(puzzleMenu).hide();
      $(group).removeClass("open");
      $(this).text("Preview");
    } else {
      $(puzzleMenu).show();
      $(group).addClass("open");
      $(this).text("Hide");
    }

    return false;
  });

  $("#reset").click(function () {

    if (!confirm("Are you sure?")) {
      return false;
    }

    var canvas = $("#canvas")[0], ctx = $("#canvas")[0].getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    $("[data-provide='show-menu']").click();
    $(".main-container").addClass("hidden");

    selectPuzzle.classList.remove("hidden");
    $("[data-provide='victory-banner']").addClass("hidden");

    $("[data-provide='puzzle-btns']").addClass("hidden");
    if ($("[data-provide='puzzle-btns']").hasClass("open")) {
      $("[data-provide='show-menu']").click();
    }

    $("[data-provide='select-image-form'] .input-group").removeClass("hidden");
    $("[data-provide='select-image-form'] .progress").addClass("hidden");
    $("[data-provide='select-image-form'] [data-provide='url-error']").text("");

    init();

    return false;
  });

  $("#giveMe").click(getHint);

  $("#shuffle").click(shuffle);

  init();
}
