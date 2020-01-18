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
  getCurrencyData();
}

client.connect({}, connectCallback, function (error) {
  alert(error.headers.message)
})

function getCurrencyData() {
  client.subscribe(priceUrl, priceListResponse);
}
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

// The last column should be a live updating sparkline which shows the midprice over the last 30 seconds. The x axis should be time. The midprice can be calculated by adding the bestBid and bestAsk fields together and dividing by 2.
function priceListResponse(message) {
  const data = message.body
  if (data) {
    const jsonData = JSON.parse(data);

    const { bestBid, bestAsk } = jsonData;
    const midprice = (bestBid + bestAsk) / 2

    if (midpriceArray.length <= 30) {
      midpriceArray.push(midprice)
    }
    jsonData.midprice = midpriceArray
    const tableHeaderCreated = createTableHeader()
    if (tableHeaderCreated) {
      const index = currencyDataArray.findIndex(currency => currency.name == jsonData.name)
      if (index >= 0) {
        currencyDataArray[index] = jsonData
      } else {
        currencyDataArray.push(jsonData)
      }
      currencyDataArray.sort(function (a, b) {
        return a.lastChangeBid - b.lastChangeBid;
      });
      // console.log(currencyDataArray.length)
      currencyDataArray.map((item, index) => {
        console.log(index)
        const table = document.getElementById("bid-table");
        let row = table.insertRow();
        for (let [key, value] of Object.entries(item)) {
          // console.log(key)
          if (key === 'midprice') {
            const sparklineId = `sparkline_${index}`;
            let cell = row.insertCell();
            cell.id = sparklineId
            var sparkline = new Sparkline(document.getElementById(sparklineId));
            sparkline.draw(midpriceArray)
          } else {
            let cell = row.insertCell();
            cell.innerHTML = value;
          }
        }
      })
    }
  }
}

  // {
  //   "name": "usdjpy",
  //   "bestBid": 106.7297012204255,
  //   "bestAsk": 107.25199883791178,
  //   "openBid": 107.22827132623534,
  //   "openAsk": 109.78172867376465,
  //   "lastChangeAsk": -4.862314256927661,
  //   "lastChangeBid": -2.8769211401569663
  // }
