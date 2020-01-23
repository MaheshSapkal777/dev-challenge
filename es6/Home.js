const url = "ws://localhost:8011/stomp"
const priceUrl = "/fx/prices"
const client = Stomp.client(url)
let currencyDataArray = [];

client.debug = function (msg) {
  if (global.DEBUG) {
    console.info(msg)
  }
}

function connectCallback(e) {
  console.log(e)
  subscribePriceList(); /** Get currency data from socket */
}

client.connect({}, connectCallback, function (error) {
  alert(error.headers.message)
})

function subscribePriceList() {
  client.subscribe(priceUrl, onPriceListResponse);
}

/** Callback function for price data response */
function onPriceListResponse(response) {
  const data = response.body
  if (data) {
    const priceData = JSON.parse(data);
    const { bestBid, bestAsk } = priceData;
    const midprice = (bestBid + bestAsk) / 2
    const isTableCreated = createTable();
    if (isTableCreated) {
      const index = currencyDataArray.findIndex(currency => currency.name == priceData.name) //Check if currency already exists in the table.
      if (index >= 0) {
        /** Update existing currency data */
        updateData(index, midprice, priceData);
      } else {
        /** Create a new entry for currency data */
        addData(midprice, priceData);
      }
      /** Sort currency data by best last changed bid */
      currencyDataArray.sort(function (a, b) {
        return a.lastChangeBid - b.lastChangeBid;
      });
      /** Render data to table view */
      renderTable();
    }
  }
}

/** Function to render the empty table with headers */
function createTable() {
  const newTable = '<table id="bid-table"></table>'
  document.getElementById('root').innerHTML = newTable
  const tableHeaders = ['Name', 'Best Bid', 'Best Ask', 'Open Bid', 'Open Ask', 'Last Change Ask', 'Last Change Bid', 'Midprice']
  const table = document.getElementById("bid-table");
  let header = table.createTHead();
  let row = header.insertRow();
  tableHeaders.map((title) => {
    let cell = row.insertCell();
    cell.class = 'table-header'
    cell.innerHTML = title;
  })
  return true
}

/** Create a new entry for those currency data, which does not exist in the table. */
function addData(midprice, priceData) {
  let newMidPriceArray = []
  newMidPriceArray.push(midprice)
  priceData.midprice = newMidPriceArray
  priceData.lastMidPrice = midprice;
  currencyDataArray.push(priceData)
}

/** Update new price data for existing currency in the table. */
function updateData(index, midprice, priceData) {
  let currentMidPriceArray = currencyDataArray[index].midprice
  /** Check if midprice data is recent 30 sec. */
  if (currentMidPriceArray.length >= 30) {
    currentMidPriceArray.shift() /** Remove first sec. value to update new one */
  }
  currentMidPriceArray.push(midprice)
  priceData.midprice = currentMidPriceArray;
  priceData.lastMidPrice = midprice;
  currencyDataArray[index] = priceData;
  updateMidPrice(index);
}

/** Update remaining currency midprice to last one. */
function updateMidPrice(index) {
  currencyDataArray.map((data, idx) => {
    if (idx !== index) {
      /** Check if midprice data is recent 30 sec. */
      if (data.midprice.length >= 30) {
        data.midprice.shift()    /** Remove the first sec. value to update the new one */
      }
      let newArray = data.midprice;
      newArray.push(data.lastMidPrice);
      data.midprice = newArray;
      currencyDataArray[idx] = data;
    }
  })
}

/** Insert currency data into table view from currency array. */
function renderTable() {
  currencyDataArray.map((item, index) => {
    const table = document.getElementById("bid-table");
    let row = table.insertRow();
    for (let [key, value] of Object.entries(item)) {
      /** Render sparkline cell */
      if (key === 'midprice') {
        const sparklineId = `sparkline_${index}`;
        let cell = row.insertCell();
        cell.id = sparklineId
        let sparkline = new Sparkline(document.getElementById(sparklineId));
        sparkline.draw(value)
      } else {
        if (key !== 'lastMidPrice') {
          let cell = row.insertCell();
          cell.innerHTML = value;
        }

      }
    }
  })
}