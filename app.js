/* If you're feeling fancy you can add interactivity 
    to your site with Javascript */

console.log("AsyncClipboardAPI | App is loaded.");

// Get references to the DOM elements with id "copy-btn"
const copyBtn = document.getElementById("copy-btn");

// Get references to the DOM elements with id "paste-btn"
const pasteBtn = document.getElementById("paste-btn");

// Get references to the DOM elements with id "paste-data"
const logOutputElm = document.getElementById("log-output");

// Get references to the DOM elements with id "clear-btn"
const clearBtn = document.getElementById("clear-btn");

let copyTextPayload = ""; //"1".repeat(10 * 1024 * 1024);
let copyHtmlPayload = "";
let copyShadowWorkbookPayload = null;

// Read a text file from the server
fetch("copy-txt-payload.txt").then((response) => {
  response.text().then((text) => {
    logMessage("Copy text payload loaded!");
    copyTextPayload = text;
  });
});

fetch("copy-shadow-workbook-payload.json").then((response) => {
  response.text().then((text) => {
    logMessage("Copy shadow workbook payload loaded!");
    copyShadowWorkbookPayload = text;
  });
});

fetch("copy-html-payload.txt").then((response) => {
  response.text().then((text) => {
    logMessage("Copy html payload loaded!");
    copyHtmlPayload = text;
  });
});

// Clipboard change event listener
if ("clipboard" in navigator && "addEventListener" in navigator.clipboard) {
  navigator.clipboard.addEventListener("clipboardchange", (event) => {
    // The event.types property contains an array of MIME types
    logMessage(
      `Clipboard content changed! Available MIME types: ${event.types}`
    );
  });
} else {
  logMessage("The clipboardchange event is not supported in this browser.");
}

function checkClipboardPermission() {
  if (navigator?.permissions?.query) {
    navigator.permissions
      .query({ name: "clipboard-read" })
      .then((permissionStatus) => {
        logMessage(`Clipboard permission state: ${permissionStatus?.state}`);
      })
      .catch((err) => {
        logMessage(
          `Failed to query the clipboard permission state. Error: ${JSON.stringify(
            err
          )}`
        );
      });
  } else {
    logMessage(`Browser does not support 'navigator.permissions.query'`);
  }
}

document.addEventListener("copy", function (e) {
  console.log("AsyncClipboardAPI | Copy event detected!");
  //const t0 = performance.now();
  //e.clipboardData.setData("text/plain", copyTextPayload); //
  // e.clipboardData.setData("text/html", copyHtmlPayload); //copyHtmlPayload
  //const t1 = performance.now();
  //logMessage(`Copy successfull. Time: ${t1 - t0} ms`);
  copyToClipboard();
  e.preventDefault();
});

document.addEventListener("paste", function (e) {
  console.log("AsyncClipboardAPI | Paste event detected!");
  pasteFromClipboard();
  e.preventDefault();
});

// Add event listeners to copyBtn
copyBtn.addEventListener("click", copyToClipboard);

// Add event listeners to pasteBtn
pasteBtn.addEventListener("click", pasteFromClipboard);

// Add event listeners to clearBtn
clearBtn.addEventListener("click", clearClipboard);

function clearClipboard() {
  logMessage("Clearing clipboard!");
  logOutputElm.value = "";

  // Clear and hide the clipboard formats table
  clearClipboardFormatsTable();

  navigator.clipboard
    .writeText("")
    .then(() => {
      logMessage("Clipboard cleared!");
    })
    .catch((err) => {
      logMessage(`Failed to clear clipboard. Error: ${err}`);
    });
}

function copyToClipboard() {
  console.log("AsyncClipboardAPI | Copying to clipboard!");

  if (!navigator.clipboard) {
    logMessage("Async Clipboard API not available!");
    return;
  }

  const t0 = performance.now();

  navigator.clipboard
    .write([
      new ClipboardItem({
        "text/plain": new Blob([copyTextPayload], { type: "text/plain" }), //copyTextPayload
        "text/html": new Blob([copyHtmlPayload], { type: "text/html" }), //copyHtmlPayload
        "web data/shadow-workbook": new Blob([copyShadowWorkbookPayload], {
          type: "web data/shadow-workbook",
        }), //copyShadowWorkbookPayload
      }),
    ])
    .then(() => {
      const t1 = performance.now();
      logMessage(`Async Copy successfull. Time: ${t1 - t0} ms`);
    })
    .catch((err) => {
      logMessage(`Failed to copy to clipboard. Error: ${err}`);
    });
}

function pasteFromClipboard() {
  console.log("AsyncClipboardAPI | Pasting from clipboard!");

  if (!navigator.clipboard) {
    logMessage("Async Clipboard API not available!");
    return;
  }

  const t0 = performance.now();

  navigator.clipboard
    .read({ unsanitized: ["text/html"] })
    .then((clipboardItems) => {
      const t1 = performance.now();
      logMessage(`Read successfull from clipboard. Time: , ${t1 - t0}ms`);

      let clipboardDataPromises = [];
      let mimeTypes = [];

      for (const clipboardItem of clipboardItems) {
        // Get all available types from clipboard
        for (const type of clipboardItem.types) {
          clipboardDataPromises.push(clipboardItem.getType(type));
          mimeTypes.push(type);
        }
      }

      if (clipboardDataPromises.length === 0) {
        // No clipboard data available
        clearClipboardFormatsTable();
        return;
      }

      return Promise.all(clipboardDataPromises)
        .then((clipboardDataBlobs) => {
          // Process each blob based on its MIME type
          return Promise.all(
            clipboardDataBlobs.map((blob, index) => {
              const mimeType = mimeTypes[index];
              if (mimeType === "image/png") {
                // For images, return the blob as a data URL
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.readAsDataURL(blob);
                });
              } else {
                // For text-based formats, convert to text
                return blob.text();
              }
            })
          );
        })
        .then((clipboardData) => {
          const t2 = performance.now();
          logMessage(`Async paste successfull. Time: ${t2 - t0} ms`);

          // Populate the clipboard formats table
          populateClipboardFormatsTable(mimeTypes, clipboardData);
        });
    })
    .catch((err) => {
      logMessage(`Failed to paste from clipboard. Error: ${err}`);
      clearClipboardFormatsTable();
    });
}

function logMessage(message) {
  logOutputElm.value += `${message}\n---------\n`;
  logOutputElm.scrollTop = logOutputElm.scrollHeight;
}

function populateClipboardFormatsTable(mimeTypes, clipboardData) {
  const table = document.getElementById("clipboard-formats");

  // Clear existing rows except header
  const existingRows = table.querySelectorAll("tr:not(:first-child)");
  existingRows.forEach((row) => row.remove());

  // Add rows for each clipboard format
  for (let i = 0; i < mimeTypes.length; i++) {
    const row = table.insertRow();
    row.className = "clipboard-format-row";

    // First column: MIME type
    const mimeTypeCell = row.insertCell(0);
    mimeTypeCell.className = "clipboard-format-type";
    mimeTypeCell.textContent = mimeTypes[i];

    // Second column: Data in textarea or image
    const dataCell = row.insertCell(1);
    dataCell.className = "clipboard-format-data";

    if (mimeTypes[i] === "image/png") {
      // For images, create an img element
      const img = document.createElement("img");
      img.src = clipboardData[i]; // clipboardData[i] should be a data URL
      img.className = "clipboard-image";
      img.alt = "Clipboard image";
      dataCell.appendChild(img);
    } else {
      // For text data, create a textarea
      const textarea = document.createElement("textarea");
      textarea.value = clipboardData[i];
      textarea.disabled = true;
      dataCell.appendChild(textarea);
    }
  }

  // Show the table if there are formats
  if (mimeTypes.length > 0) {
    table.classList.add("visible");
  } else {
    table.classList.remove("visible");
  }
}

function clearClipboardFormatsTable() {
  const table = document.getElementById("clipboard-formats");

  // Clear existing rows except header
  const existingRows = table.querySelectorAll("tr:not(:first-child)");
  existingRows.forEach((row) => row.remove());

  // Hide the table
  table.classList.remove("visible");
}

checkClipboardPermission();
