const url = "ws://localhost:8011/stomp"
const priceUrl = "/fx/prices"
let bidDataArray = [];
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
  client.subscribe(priceUrl, priceListRespons);
}
function createTableHeader() {
  const newTable = '<table id="bid-table">' +
    '<tr><th>Name</th>' +
    '<th>Best Bid</th>' +
    '<th>Best Ask</th>' +
    '<th>Open Bid</th>' +
    '<th>Open Ask</th>' +
    '<th>Last Change Ask</th>' +
    '<th>Last Change Bid</th>' +
    '</tr>' +
    '</table>';
  document.getElementById('root').innerHTML = newTable
}
function priceListRespons(message) {
  const data = message.body
  if (data) {
    const jsonData = JSON.parse(data);
    createTableHeader()
    const index = bidDataArray.findIndex(p => p.name == jsonData.name)
    if (index >= 0) {
      bidDataArray[index] = jsonData
    } else {
      bidDataArray.push(jsonData)
    }
    console.log(bidDataArray.length)
    let tableData = ''
    bidDataArray.map((item) => {
      var table = document.getElementById("bid-table");
      var row = table.insertRow();
      for (let [key, value] of Object.entries(item)) {
        var cell1 = row.insertCell();
        cell1.innerHTML = value;
      }
    }
    )
    document.getElementById('bid-table').innerHtml = tableData;
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
