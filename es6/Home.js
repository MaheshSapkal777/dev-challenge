const url = "ws://localhost:8011/stomp"
const priceUrl = "/fx/prices"
let currencyDataArray = [];
let midpriceArray = [];
const client = Stomp.client(url)
let tableHeaderPresent = false;
client.debug = function (msg) {
  if (global.DEBUG) {
    console.info(msg)
  }
}
function connectCallback(e) {
  console.log(e)
  /** to get currency data from socket */
  getCurrencyData();
}

client.connect({}, connectCallback, function (error) {
  alert(error.headers.message)
})

function getCurrencyData() {
  client.subscribe(priceUrl, priceListResponse);
}
/** function to render table header */
function createTableHeader() {
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
/** callback function for price data  */
function priceListResponse(message) {
  const data = message.body
  if (data) {
    const jsonData = JSON.parse(data);
    const { bestBid, bestAsk } = jsonData;
    const midprice = (bestBid + bestAsk) / 2
    const tableHeaderCreated = createTableHeader();
    if (tableHeaderCreated) {
      const index = currencyDataArray.findIndex(currency => currency.name == jsonData.name) //check if currency already exist in table.
      if (index >= 0) {
        /**update existing currency data */
        updateExitingCurrencyData(index, midprice, jsonData);
      } else {
        /**create new entry for currency data */
        creatNewCurrencyData(midprice, jsonData);
      }
      /** sort currency data by best last changed bid */
      currencyDataArray.sort(function (a, b) {
        return a.lastChangeBid - b.lastChangeBid;
      });
      /**render data to table view */
      renderTableData();
    }
  }
}

/**create new entry for those currecy data, which is not present in table */
function creatNewCurrencyData(midprice, jsonData) {
  let newMidPriceArray = []
  newMidPriceArray.push(midprice)
  jsonData.midprice = newMidPriceArray
  jsonData.lastMidPrice = midprice;
  currencyDataArray.push(jsonData)
}

/** update new price data for existing currency */
function updateExitingCurrencyData(index, midprice, jsonData) {
  let currentMidPriceArray = currencyDataArray[index].midprice
  /**check if midprice data is recent 30 sec. */
  if (currentMidPriceArray.length >= 30) {
    currentMidPriceArray.shift() /**remove first sec. value to update new one */
  }
  currentMidPriceArray.push(midprice)
  jsonData.midprice = currentMidPriceArray;
  jsonData.lastMidPrice = midprice;
  currencyDataArray[index] = jsonData;
  updateOtherCurrencyMidprice(index);
}

/**update other currency midprice to last one. */
function updateOtherCurrencyMidprice(index) {
  currencyDataArray.map((data, idx) => {
    if (idx !== index) {
      /**check if midprice data is recent 30 sec. */
      if (data.midprice.length >= 30) {
        data.midprice.shift()    /**remove first sec. value to update new one */
      }
      let newArray = data.midprice;
      newArray.push(data.lastMidPrice);
      data.midprice = newArray;
      currencyDataArray[idx] = data;
    }
  })
}
/** create table data view for currency data */
function renderTableData() {
  currencyDataArray.map((item, index) => {
    const table = document.getElementById("bid-table");
    let row = table.insertRow();
    for (let [key, value] of Object.entries(item)) {
      index === 0 && console.log(item.midprice)
      /**render sparkline cell */
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