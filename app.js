/* If you're feeling fancy you can add interactivity 
    to your site with Javascript */

console.log("AsyncClipboardAPI | App is loaded.");

// Get references to the DOM elements with id "cut-btn"
const cutBtn = document.getElementById("cut-btn");

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

// Add event listeners to cutBtn
cutBtn.addEventListener("click", cutToClipboard);

// Add event listeners to copyBtn
copyBtn.addEventListener("click", copyToClipboard);

// Add event listeners to pasteBtn
pasteBtn.addEventListener("click", pasteFromClipboard);

// Add event listeners to clearBtn
clearBtn.addEventListener("click", clearLogOutputAndClipboard);

function clearLogOutputAndClipboard() {
  logMessage("Clearing clipboard!");
  logOutputElm.value = "";

  // Clear and hide the clipboard formats table
  clearClipboardFormatsTable();

  // Clear the clipboard by writing an empty string
  const copyEventHandler = (e) => {
    e.clipboardData.setData("text/plain", "");
    e.preventDefault();
    e.stopPropagation();

    // Remove the event listener immediately after clearing the clipboard
    document.removeEventListener("copy", copyEventHandler, {
      once: true,
      capture: false,
    });
  };

  // Add a one-time event listener for the copy event
  document.addEventListener("copy", copyEventHandler, {
    once: true,
    capture: false,
  });

  // Trigger the copy event to clear the clipboard
  document.execCommand("copy");
}

function cutToClipboard() {
  logMessage("DataTransfer API | Cutting to clipboard!");

  const cutEventHandler = (e) => {
    // Set text/plain data
    e.clipboardData.setData("text/plain", copyTextPayload);
    // Set text/html data
    e.clipboardData.setData("text/html", copyHtmlPayload);

    e.preventDefault();
    e.stopPropagation();
    // Remove the event listener immediately after cutting to the clipboard
    document.removeEventListener("cut", cutEventHandler, {
      once: true,
      capture: false,
    });
  };

  // Add a one-time event listener for the cut event
  document.addEventListener("cut", cutEventHandler, {
    once: true,
    capture: false,
  });

  // Trigger the cut event
  const result = document.execCommand("cut");

  logMessage(`Cut command executed with result: ${result}`);
}

function copyToClipboard() {
  logMessage("DataTransfer API | Copying to clipboard!");

  const copyEventHandler = (e) => {
    // Set text/plain data
    e.clipboardData.setData("text/plain", copyTextPayload);
    // Set text/html data
    e.clipboardData.setData("text/html", copyHtmlPayload);

    e.preventDefault();
    e.stopPropagation();

    // Remove the event listener immediately after copying to the clipboard
    document.removeEventListener("copy", copyEventHandler, {
      once: true,
      capture: false,
    });
  };

  // Add a one-time event listener for the copy event
  document.addEventListener("copy", copyEventHandler, {
    once: true,
    capture: false,
  });

  // Trigger the copy event
  const result = document.execCommand("copy");

  logMessage(`Copy command executed with result: ${result}`);
}

function pasteFromClipboard() {
  logMessage("DataTransfer API | Pasting from clipboard!");

  const pasteEventHandler = (e) => {
    const clipboardData = e.clipboardData;
    const mimeTypes = clipboardData.types;
    const data = [];

    if (mimeTypes.length !== 0) {
      for (let i = 0; i < mimeTypes.length; i++) {
        const type = mimeTypes[i];
        const value = clipboardData.getData(type);
        data.push(value);
      }

      populateClipboardFormatsTable(mimeTypes, data);
    } else {
      logMessage("No data found in clipboard.");
      clearClipboardFormatsTable();
    }

    e.preventDefault();
    e.stopPropagation();

    // Remove the event listener immediately after pasting from the clipboard
    document.removeEventListener("paste", pasteEventHandler, {
      once: true,
      capture: false,
    });
  };

  // Add a one-time event listener for the paste event
  document.addEventListener("paste", pasteEventHandler, {
    once: true,
    capture: false,
  });

  // Trigger the paste event
  const result = document.execCommand("paste");

  logMessage(`Paste command executed with result: ${result}`);
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
