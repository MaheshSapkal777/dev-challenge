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
    const tableHeaderCreated = createTableHeader()
    if (tableHeaderCreated) {
      const index = currencyDataArray.findIndex(currency => currency.name == jsonData.name)
      if (index >= 0) {
        let currentMidPriceArray = currencyDataArray[index].midprice
        if (currentMidPriceArray.length >= 30) {
          currentMidPriceArray.shift()
        }
        currentMidPriceArray.push(midprice)
        jsonData.midprice = currentMidPriceArray;
        jsonData.lastMidPrice = midprice;
        currencyDataArray[index] = jsonData;
        //update other currency midprice to last one.
        currencyDataArray.map((data, idx) => {
          if (idx !== index) {
            if (data.midprice.length >= 30) {
              data.midprice.shift()
            }
            let newArray = data.midprice;
            newArray.push(data.lastMidPrice);
            data.midprice = newArray;
            currencyDataArray[idx] = data;
          }
        })
      } else {
        let newMidPriceArray = []
        newMidPriceArray.push(midprice)
        jsonData.midprice = newMidPriceArray
        jsonData.lastMidPrice = midprice;
        currencyDataArray.push(jsonData)
      }
      currencyDataArray.sort(function (a, b) {
        return a.lastChangeBid - b.lastChangeBid;
      });
      // console.log(currencyDataArray.length)
      currencyDataArray.map((item, index) => {
        // index == 0 && console.log(item.midprice)
        const table = document.getElementById("bid-table");
        let row = table.insertRow();
        for (let [key, value] of Object.entries(item)) {
          // console.log(key)
          if (key === 'midprice') {
            const sparklineId = `sparkline_${index}`;
            let cell = row.insertCell();
            cell.id = sparklineId
            var sparkline = new Sparkline(document.getElementById(sparklineId));
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
  }
}