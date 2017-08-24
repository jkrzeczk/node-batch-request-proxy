const express = require('express');
const request = require('request-promise-native');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.post('/batch', async (req, res, next) => {
  var parallel_requests_options = [];

  req.body.requests.forEach(function(item, index) {
    var options = {
      method: item.method,
      uri: item.url,
      qs: req.query,
      resolveWithFullResponse: true,
      json: true,
    };

    parallel_requests_options.push(to(request(options)));
  });

  const values = await throttleActions(parallel_requests_options, 3);

  res.send({ responses: values });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


function to(promise) {
  return promise
      .then(data => data)
      .catch(err => err);
}

function throttleActions(actions, limit) {
  var i = 0;
  var resultArray = new Array(actions.length);

  function doNextAction() {
    if (i < actions.length) {
      var actionIndex = i++;
      var nextAction = actions[actionIndex];

      return Promise.resolve(nextAction)
          .then(DelayPromise(1000))
          .then(result => {
            resultArray[actionIndex] = result;
            return;
          }).then(doNextAction);
    }
  }

  var promises = [];
  while (i < limit && i < actions.length) {
    promises.push(doNextAction());
  }
  return Promise.all(promises).then(() => resultArray);
}

//for testing request delays
function DelayPromise(delay) {
  return function(data) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve(data);
      }, delay);
    });
  }
}
