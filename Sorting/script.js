const barsContainer = document.getElementById("bars-container");
const sizeSlider = document.getElementById("size-slider");
const speedSlider = document.getElementById("speed-slider");
const newArrayBtn = document.getElementById("new-array");
const startSortBtn = document.getElementById("start-sort");
const algoSelect = document.getElementById("algo-select");

const inputModeRadios = document.querySelectorAll('input[name="input-mode"]');
const customInputBox = document.getElementById("custom-input-box");
const customArrayInput = document.getElementById("custom-array");
const useCustomArrayBtn = document.getElementById("use-custom-array");
const clearInputBtn = document.getElementById("clear-input");

let array = [];


function updateBar(bar, value) {
  bar.style.height = value + "px";
  bar.title = value;
  if (bar.children.length) {
    bar.children[0].innerText = value;
  }
}


// Input mode handling
inputModeRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    if (document.querySelector('input[name="input-mode"]:checked').value === "custom") {
      customInputBox.style.display = "block";
    } else {
      customInputBox.style.display = "none";
    }
  });
});

useCustomArrayBtn.addEventListener("click", () => {
  const input = customArrayInput.value.trim();
  if (!input) return alert("Please enter an array!");
  const parts = input.split(",").map(num => parseInt(num.trim()));
  if (parts.some(isNaN) || parts.some(val => val < 10 || val > 300)) {
    alert("Enter only numbers between 10 and 300, comma-separated.");
    return;
  }
  array = parts;
  displayCustomArray(array);
});

clearInputBtn.addEventListener("click", () => {
  customArrayInput.value = "";
});

// Generate random array
function generateArray(size) {
  const inputMode = document.querySelector('input[name="input-mode"]:checked').value;
  if (inputMode !== "random") return;

  array = [];
  barsContainer.innerHTML = "";

  for (let i = 0; i < size; i++) {
    const value = Math.floor(Math.random() * 300) + 20;
    array.push(value);
    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = value + "px";
    bar.style.width = `${600 / size}px`;

    if (size <= 25) {
      const label = document.createElement("div");
      label.classList.add("bar-label");
      label.innerText = value;
      bar.appendChild(label);
    } else {
      bar.title = value;
    }

    barsContainer.appendChild(bar);
  }

  updateArrayDisplay();
}

function displayCustomArray(arr) {
  barsContainer.innerHTML = "";
  const size = arr.length;

  for (let i = 0; i < size; i++) {
    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = arr[i] + "px";
    bar.style.width = `${600 / size}px`;

    if (size <= 25) {
      const label = document.createElement("div");
      label.classList.add("bar-label");
      label.innerText = arr[i];
      bar.appendChild(label);
    } else {
      bar.title = arr[i];
    }

    barsContainer.appendChild(bar);
  }

  updateArrayDisplay();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🟣 Bubble Sort
async function bubbleSort() {
  const bars = document.getElementsByClassName("bar");
  const speed = 550 - speedSlider.value * 50;

  for (let i = 0; i < array.length - 1; i++) {
    for (let j = 0; j < array.length - i - 1; j++) {

      bars[j].style.backgroundColor = "red";
      bars[j + 1].style.backgroundColor = "red";
      await sleep(speed);

      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        updateBar(bars[j], array[j]);
        updateBar(bars[j + 1], array[j + 1]);
      }

      bars[j].style.backgroundColor = "#9b59b6";
      bars[j + 1].style.backgroundColor = "#9b59b6";
    }
    bars[array.length - i - 1].style.backgroundColor = "green";
  }

  bars[0].style.backgroundColor = "green";
  await sleep(100);
  updateArrayDisplay();
}



// 🔵 Selection Sort
async function selectionSort() {
  const bars = document.getElementsByClassName("bar");
  const speed = 550 - speedSlider.value * 50;

  for (let i = 0; i < array.length; i++) {
    let minIndex = i;
    bars[minIndex].style.backgroundColor = "blue";
    for (let j = i + 1; j < array.length; j++) {
      bars[j].style.backgroundColor = "red";
      await sleep(speed);
      if (array[j] < array[minIndex]) {
        bars[minIndex].style.backgroundColor = "#9b59b6";
        minIndex = j;
        bars[minIndex].style.backgroundColor = "blue";
      } else {
        bars[j].style.backgroundColor = "#9b59b6";
      }
    }
    if (minIndex !== i) {
      [array[i], array[minIndex]] = [array[minIndex], array[i]];
      updateBar(bars[i], array[i]);
      updateBar(bars[minIndex], array[minIndex]);
    }
    bars[minIndex].style.backgroundColor = "#9b59b6";
    bars[i].style.backgroundColor = "green";
  }
  await sleep(100);
  updateArrayDisplay();
}

// 🟡 Insertion Sort
async function insertionSort() {
  const bars = document.getElementsByClassName("bar");
  const speed = 550 - speedSlider.value * 50;

  for (let i = 1; i < array.length; i++) {
    let key = array[i];
    let j = i - 1;

    while (j >= 0 && array[j] > key) {
      bars[j + 1].style.backgroundColor = "red";
      array[j + 1] = array[j];
      updateBar(bars[j + 1], array[j + 1]);
      await sleep(speed);
      bars[j + 1].style.backgroundColor = "#9b59b6";
      j--;
    }

    array[j + 1] = key;
    updateBar(bars[j + 1], key);
  }

  for (let k = 0; k < bars.length; k++) {
    bars[k].style.backgroundColor = "green";
    await sleep(10);
  }

  await sleep(100);
  updateArrayDisplay();
}

// 🟢 Merge Sort
async function mergeSort(start = 0, end = array.length - 1) {
  if (start >= end) return;

  const mid = Math.floor((start + end) / 2);
  await mergeSort(start, mid);
  await mergeSort(mid + 1, end);
  await merge(start, mid, end);

  if (start === 0 && end === array.length - 1) {
    const bars = document.getElementsByClassName("bar");
    for (let i = 0; i < bars.length; i++) {
      bars[i].style.backgroundColor = "green";
      await sleep(10);
    }
    await sleep(100);
    updateArrayDisplay();
  }
}

async function merge(start, mid, end) {
  const bars = document.getElementsByClassName("bar");
  const speed = 550 - speedSlider.value * 50;

  let left = array.slice(start, mid + 1);
  let right = array.slice(mid + 1, end + 1);
  let i = 0, j = 0, k = start;

  while (i < left.length && j < right.length) {
    bars[k].style.backgroundColor = "red";
    await sleep(speed);

    if (left[i] <= right[j]) {
      array[k] = left[i++];
    } else {
      array[k] = right[j++];
    }

    updateBar(bars[k], array[k]);
    bars[k].style.backgroundColor = "#9b59b6";
    k++;
  }

  while (i < left.length) {
    array[k] = left[i++];
    updateBar(bars[k], array[k]);
    bars[k].style.backgroundColor = "#9b59b6";
    k++;
    await sleep(speed);
  }

  while (j < right.length) {
    array[k] = right[j++];
    updateBar(bars[k], array[k]);
    bars[k].style.backgroundColor = "#9b59b6";
    k++;
    await sleep(speed);
  }
}

// 🔺 Quick Sort
async function quickSort(start = 0, end = array.length - 1) {
  if (start < end) {
    const pi = await partition(start, end);
    await quickSort(start, pi - 1);
    await quickSort(pi + 1, end);
  }

  if (start === 0 && end === array.length - 1) {
    const bars = document.getElementsByClassName("bar");
    for (let i = 0; i < bars.length; i++) {
      bars[i].style.backgroundColor = "green";
      await sleep(10);
    }
    await sleep(100);
    updateArrayDisplay();
  }
}

async function partition(low, high) {
  const bars = document.getElementsByClassName("bar");
  const speed = 550 - speedSlider.value * 50;

  let pivot = array[high];
  bars[high].style.backgroundColor = "orange";
  let i = low - 1;

  for (let j = low; j < high; j++) {
    bars[j].style.backgroundColor = "red";
    await sleep(speed);

    if (array[j] < pivot) {
      i++;
      [array[i], array[j]] = [array[j], array[i]];
      updateBar(bars[i], array[i]);
      updateBar(bars[j], array[j]);
    }

    bars[j].style.backgroundColor = "#9b59b6";
  }

  [array[i + 1], array[high]] = [array[high], array[i + 1]];
  updateBar(bars[i + 1], array[i + 1]);
  updateBar(bars[high], array[high]);

  bars[high].style.backgroundColor = "#9b59b6";
  bars[i + 1].style.backgroundColor = "green";

  return i + 1;
}

// 📦 Button Events
newArrayBtn.addEventListener("click", () => {
  document.querySelector('input[name="input-mode"][value="random"]').checked = true;
  customInputBox.style.display = "none";
  generateArray(sizeSlider.value);
});

sizeSlider.addEventListener("input", () => generateArray(sizeSlider.value));

startSortBtn.addEventListener("click", async () => {
  switch (algoSelect.value) {
    case "bubble": await bubbleSort(); break;
    case "selection": await selectionSort(); break;
    case "insertion": await insertionSort(); break;
    case "merge": await mergeSort(); break;
    case "quick": await quickSort(); break;
  }
});


// 📘 Explanation
const explanationMap = {
  bubble: "Bubble Sort: Repeatedly compares adjacent elements and swaps them if they are in the wrong order.",
  selection: "Selection Sort: Selects the minimum element and places it at the front.",
  insertion: "Insertion Sort: Inserts elements into their correct place in the sorted section.",
  merge: "Merge Sort: Divides, sorts recursively, and merges arrays.",
  quick: "Quick Sort: Picks a pivot and partitions around it recursively."
};

algoSelect.addEventListener("change", () => {
  const selected = algoSelect.value;
  document.getElementById("algo-description").innerText = explanationMap[selected];
});

// 🌙 Dark Mode
const toggle = document.getElementById('mode-toggle');
toggle.addEventListener('change', () => {
  document.body.classList.toggle('dark');
});


window.onload = () => generateArray(sizeSlider.value);

function updateArrayDisplay() {
  // Optional hook if you use it elsewhere
}
