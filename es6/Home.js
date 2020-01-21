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
  subscribePriceList(); /** get currency data from socket */
}

client.connect({}, connectCallback, function (error) {
  alert(error.headers.message)
})

function subscribePriceList() {
  client.subscribe(priceUrl, onPriceListResponse);
}

/** callback function for price data response */
function onPriceListResponse(response) {
  const data = response.body
  if (data) {
    const priceData = JSON.parse(data);
    const { bestBid, bestAsk } = priceData;
    const midprice = (bestBid + bestAsk) / 2
    const isTableCreated = createTableWithHeaders();
    if (isTableCreated) {
      const index = currencyDataArray.findIndex(currency => currency.name == priceData.name) //check if currency already exist in table.
      if (index >= 0) {
        /**update existing currency data */
        updateExistingCurrencyDataInArray(index, midprice, priceData);
      } else {
        /**create new entry for currency data */
        addNewCurrencyDataInArray(midprice, priceData);
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

/** function to render empty table with headers */
function createTableWithHeaders() {
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

/**create new entry for those currecy data, which is not present in table */
function addNewCurrencyDataInArray(midprice, priceData) {
  let newMidPriceArray = []
  newMidPriceArray.push(midprice)
  priceData.midprice = newMidPriceArray
  priceData.lastMidPrice = midprice;
  currencyDataArray.push(priceData)
}

/** update new price data for existing currency */
function updateExistingCurrencyDataInArray(index, midprice, priceData) {
  let currentMidPriceArray = currencyDataArray[index].midprice
  /**check if midprice data is recent 30 sec. */
  if (currentMidPriceArray.length >= 30) {
    currentMidPriceArray.shift() /**remove first sec. value to update new one */
  }
  currentMidPriceArray.push(midprice)
  priceData.midprice = currentMidPriceArray;
  priceData.lastMidPrice = midprice;
  currencyDataArray[index] = priceData;
  updateMidPriceForRemainingCurrencies(index);
}

/**update remaining currency midprice to last one. */
function updateMidPriceForRemainingCurrencies(index) {
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

/** insert currency data into table view from currency array. */
function renderTableData() {
  currencyDataArray.map((item, index) => {
    const table = document.getElementById("bid-table");
    let row = table.insertRow();
    for (let [key, value] of Object.entries(item)) {
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